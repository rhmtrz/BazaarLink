import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { error } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { z } from 'zod';
import type { Session, User } from '@prisma/client';
import { prisma } from '$lib/server/prisma';
import { logger } from '$lib/server/logger';

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

	logger.info({ userId: user.id, event: 'register' }, 'auth');
	return startSession(user, ctx);
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

	logger.info({ userId: user.id, event: 'login' }, 'auth');
	return startSession(user, ctx);
}

export async function logout(sessionId: string): Promise<void> {
	await prisma.session.updateMany({
		where: { id: sessionId, revokedAt: null },
		data: { revokedAt: new Date() }
	});
	logger.info({ sessionId, event: 'logout' }, 'auth');
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

export async function loadSession(token: string): Promise<{ user: User; session: Session } | null> {
	const payload = verifyJwt(token);
	if (!payload) return null;

	const session = await prisma.session.findUnique({
		where: { id: payload.jti },
		include: { user: true }
	});
	if (!session) return null;
	if (session.revokedAt) return null;
	if (session.expiresAt < new Date()) return null;

	const { user, ...rest } = session;
	return { user, session: rest };
}
