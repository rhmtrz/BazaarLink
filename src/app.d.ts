// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			requestId?: string;
		}
		interface Locals {
			requestId: string;
			user: {
				id: string;
				email: string;
				role: 'BUYER' | 'SUPPLIER' | 'ADMIN' | 'INSPECTOR';
				mustChangePassword: boolean;
			} | null;
			session: { id: string } | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
