import { expireRfq, findExpiredRfqIds } from '$lib/server/rfq';
import { logger } from '$lib/server/logger';

export async function processRfqExpirationJob(): Promise<{
	scanned: number;
	expired: number;
}> {
	const ids = await findExpiredRfqIds();
	let expired = 0;
	for (const id of ids) {
		try {
			await expireRfq(id);
			expired++;
		} catch (err) {
			logger.error({ err, rfqId: id }, 'rfq-expiration: failed to expire RFQ');
		}
	}
	logger.info({ scanned: ids.length, expired }, 'rfq-expiration scan complete');
	return { scanned: ids.length, expired };
}
