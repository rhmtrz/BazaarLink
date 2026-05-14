import { error } from '@sveltejs/kit';

export type AuthedUser = NonNullable<App.Locals['user']>;
export type Role = AuthedUser['role'];

export function requireAuth(locals: App.Locals): AuthedUser {
	if (!locals.user) throw error(401, 'Sign in required');
	return locals.user;
}

export function requireRole(locals: App.Locals, ...roles: Role[]): AuthedUser {
	const user = requireAuth(locals);
	if (!roles.includes(user.role)) throw error(403, 'Forbidden');
	return user;
}

export function requireOwnership(locals: App.Locals, ownerId: string): AuthedUser {
	const user = requireAuth(locals);
	if (user.id !== ownerId && user.role !== 'ADMIN') throw error(403, 'Forbidden');
	return user;
}
