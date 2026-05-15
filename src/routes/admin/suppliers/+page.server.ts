import type { PageServerLoad } from './$types';
import { listSuppliers } from '$lib/server/suppliers';

const ALLOWED = ['PENDING', 'APPROVED', 'REJECTED'] as const;
type Status = (typeof ALLOWED)[number];

export const load: PageServerLoad = async ({ url }) => {
	const raw = url.searchParams.get('status');
	const status: Status | undefined = (ALLOWED as readonly string[]).includes(raw ?? '')
		? (raw as Status)
		: raw === 'ALL'
			? undefined
			: 'PENDING';
	const suppliers = await listSuppliers({ status });
	return { suppliers, currentStatus: status ?? 'ALL' };
};
