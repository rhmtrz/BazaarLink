import type { PageServerLoad } from './$types';
import { listIncomingRfqs, SUPPLIER_RFQ_TABS, type SupplierRfqTab } from '$lib/server/rfq';

function parseTab(raw: string | null): SupplierRfqTab | undefined {
	if (!raw) return undefined;
	return SUPPLIER_RFQ_TABS.find((t) => t === raw);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const tab = parseTab(url.searchParams.get('tab')) ?? 'PENDING';
	const rfqs = await listIncomingRfqs(locals.user!.id, tab);
	return { rfqs, tab };
};
