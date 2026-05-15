import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { error } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { z } from 'zod';
import type { Session, Supplier, User } from '@prisma/client';
import { prisma } from '$lib/server/prisma';
import { recordAuditEvent } from '$lib/server/audit';

export const AUTH_COOKIE_NAME = 'auth_token';

const BCRYPT_ROUNDS = 12;
const PLACEHOLDER_SECRET = 'replace-with-a-long-random-string';

export type AuthResult = { user: User; sessionId: string; token: string };
export type SessionContext = { ipAddress?: string; userAgent?: string };

const credentialsSchema = z.object({
	email: z.email().max(254),
	// bcrypt silently truncates past 72 bytes; cap here so long passwords
	// never get weakened without the user knowing.
	password: z.string().min(8).max(72)
});

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1).max(72),
	newPassword: z.string().min(8).max(72)
});

const inviteSchema = z.object({
	email: z.email().max(254),
	role: z.enum(['BUYER', 'SUPPLIER', 'ADMIN', 'INSPECTOR'])
});

type RoleLiteral = 'BUYER' | 'SUPPLIER' | 'ADMIN' | 'INSPECTOR';

export type InviteUserResult = {
	userId: string;
	email: string;
	role: RoleLiteral;
	tempPassword: string;
};

type JwtPayload = { sub: string; jti: string };

function getJwtSecret(): string {
	const secret = env.JWT_SECRET;
	if (!secret || secret === PLACEHOLDER_SECRET) {
		throw new Error('JWT_SECRET is not configured');
	}
	return secret;
}

function getJwtExpiresIn(): string {
	return env.JWT_EXPIRES_IN || '7d';
}

function parseExpiryMs(spec: string): number {
	const m = /^(\d+)([smhd])$/.exec(spec);
	if (!m) throw new Error(`Invalid JWT_EXPIRES_IN: ${spec}`);
	const n = Number(m[1]);
	const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[m[2] as 's' | 'm' | 'h' | 'd'];
	return n * unit;
}

async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
	return bcrypt.compare(password, passwordHash);
}

function signJwt(payload: JwtPayload): string {
	return jwt.sign(payload, getJwtSecret(), {
		expiresIn: getJwtExpiresIn() as jwt.SignOptions['expiresIn']
	});
}

function verifyJwt(token: string): JwtPayload | null {
	try {
		const decoded = jwt.verify(token, getJwtSecret());
		if (typeof decoded === 'string') return null;
		const { sub, jti } = decoded as jwt.JwtPayload;
		if (typeof sub !== 'string' || typeof jti !== 'string') return null;
		return { sub, jti };
	} catch {
		return null;
	}
}

async function startSession(user: User, ctx: SessionContext): Promise<AuthResult> {
	const ttlMs = parseExpiryMs(getJwtExpiresIn());
	const session = await prisma.session.create({
		data: {
			userId: user.id,
			expiresAt: new Date(Date.now() + ttlMs),
			ipAddress: ctx.ipAddress,
			userAgent: ctx.userAgent
		}
	});
	const token = signJwt({ sub: user.id, jti: session.id });
	return { user, sessionId: session.id, token };
}

export async function register(input: unknown, ctx: SessionContext): Promise<AuthResult> {
	const parsed = credentialsSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const email = parsed.data.email.toLowerCase();
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) throw error(409, 'Email already in use');

	const passwordHash = await hashPassword(parsed.data.password);
	const user = await prisma.user.create({ data: { email, passwordHash } });

	const result = await startSession(user, ctx);
	await recordAuditEvent({
		type: 'REGISTER',
		actorUserId: user.id,
		sessionId: result.sessionId,
		ipAddress: ctx.ipAddress,
		userAgent: ctx.userAgent
	});
	return result;
}

export async function login(input: unknown, ctx: SessionContext): Promise<AuthResult> {
	const parsed = credentialsSchema.safeParse(input);
	if (!parsed.success) throw error(401, 'Invalid email or password');

	const email = parsed.data.email.toLowerCase();
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		// Equalize response time so absence of an account is not leaked by timing.
		await hashPassword(parsed.data.password);
		throw error(401, 'Invalid email or password');
	}

	const ok = await verifyPassword(parsed.data.password, user.passwordHash);
	if (!ok) throw error(401, 'Invalid email or password');

	const priorSession = ctx.userAgent
		? await prisma.session.findFirst({
				where: { userId: user.id, userAgent: ctx.userAgent }
			})
		: null;
	const newDevice = ctx.userAgent != null && priorSession === null;

	const result = await startSession(user, ctx);
	await recordAuditEvent({
		type: 'LOGIN',
		actorUserId: user.id,
		sessionId: result.sessionId,
		ipAddress: ctx.ipAddress,
		userAgent: ctx.userAgent
	});
	if (newDevice) {
		await recordAuditEvent({
			type: 'LOGIN_FROM_NEW_DEVICE',
			actorUserId: user.id,
			sessionId: result.sessionId,
			ipAddress: ctx.ipAddress,
			userAgent: ctx.userAgent
		});
	}
	return result;
}

export async function logout(sessionId: string, ctx: SessionContext = {}): Promise<void> {
	const s = await prisma.session.findUnique({
		where: { id: sessionId },
		select: { userId: true }
	});
	if (!s) return;

	await prisma.session.updateMany({
		where: { id: sessionId, revokedAt: null },
		data: { revokedAt: new Date() }
	});
	await recordAuditEvent({
		type: 'LOGOUT',
		actorUserId: s.userId,
		sessionId,
		ipAddress: ctx.ipAddress,
		userAgent: ctx.userAgent
	});
}

export function setAuthCookie(cookies: Cookies, token: string): void {
	const ttlSeconds = Math.floor(parseExpiryMs(getJwtExpiresIn()) / 1000);
	cookies.set(AUTH_COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: ttlSeconds
	});
}

export function clearAuthCookie(cookies: Cookies): void {
	cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}

function generateTempPassword(): string {
	return randomBytes(12).toString('base64url').slice(0, 16);
}

export async function inviteUser(input: unknown, actorUserId: string): Promise<InviteUserResult> {
	const parsed = inviteSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const email = parsed.data.email.toLowerCase();
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) throw error(409, 'Email already in use');

	const tempPassword = generateTempPassword();
	const passwordHash = await hashPassword(tempPassword);

	const user = await prisma.user.create({
		data: {
			email,
			passwordHash,
			role: parsed.data.role,
			mustChangePassword: true
		}
	});

	await recordAuditEvent({
		type: 'USER_INVITED',
		actorUserId,
		payload: {
			invitedUserId: user.id,
			invitedEmail: user.email,
			invitedRole: user.role
		}
	});

	return {
		userId: user.id,
		email: user.email,
		role: user.role,
		tempPassword
	};
}

export async function changePassword(userId: string, input: unknown): Promise<void> {
	const parsed = changePasswordSchema.safeParse(input);
	if (!parsed.success) throw error(400, parsed.error.issues[0].message);

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw error(404, 'User not found');

	const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
	if (!ok) throw error(401, 'Current password is incorrect');

	if (parsed.data.currentPassword === parsed.data.newPassword) {
		throw error(400, 'New password must differ from current password');
	}

	const newHash = await hashPassword(parsed.data.newPassword);
	await prisma.user.update({
		where: { id: userId },
		data: { passwordHash: newHash, mustChangePassword: false }
	});

	await recordAuditEvent({
		type: 'PASSWORD_CHANGED',
		actorUserId: userId
	});
}

export async function loadSession(
	token: string
): Promise<{ user: User & { supplier: Supplier | null }; session: Session } | null> {
	const payload = verifyJwt(token);
	if (!payload) return null;

	const session = await prisma.session.findUnique({
		where: { id: payload.jti },
		include: { user: { include: { supplier: true } } }
	});
	if (!session) return null;
	if (session.revokedAt) return null;
	if (session.expiresAt < new Date()) return null;

	const { user, ...rest } = session;
	return { user, session: rest };
}
