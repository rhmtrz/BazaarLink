export {
	AUTH_COOKIE_NAME,
	register,
	login,
	logout,
	loadSession,
	setAuthCookie,
	clearAuthCookie,
	changePassword
} from './service';
export type { AuthResult, SessionContext } from './service';
