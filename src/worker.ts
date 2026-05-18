import 'dotenv/config';
import { Worker } from 'bullmq';
import {
	queueRedis,
	rfqQueue,
	processRfqExpirationJob,
	RFQ_EXPIRATION_QUEUE,
	RFQ_EXPIRATION_SCAN_JOB_ID,
	RFQ_EXPIRATION_CRON
} from '$lib/server/jobs';
import { logger } from '$lib/server/logger';

await rfqQueue.add(
	'scan',
	{},
	{
		repeat: { pattern: RFQ_EXPIRATION_CRON },
		jobId: RFQ_EXPIRATION_SCAN_JOB_ID,
		removeOnComplete: 100,
		removeOnFail: 100
	}
);

const worker = new Worker(RFQ_EXPIRATION_QUEUE, async () => processRfqExpirationJob(), {
	connection: queueRedis,
	concurrency: 1
});

worker.on('completed', (job) => logger.info({ jobId: job.id }, 'worker job completed'));
worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'worker job failed'));

logger.info({ queue: RFQ_EXPIRATION_QUEUE, cron: RFQ_EXPIRATION_CRON }, 'worker started');

function shutdown(signal: string) {
	logger.info({ signal }, 'worker shutting down');
	void (async () => {
		await worker.close();
		await rfqQueue.close();
		await queueRedis.quit();
		process.exit(0);
	})();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
