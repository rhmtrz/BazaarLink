import { Queue } from 'bullmq';
import { queueRedis } from './connection';

export const RFQ_EXPIRATION_QUEUE = 'rfq-expiration';
export const RFQ_EXPIRATION_SCAN_JOB_ID = 'rfq-expiration-scan';
export const RFQ_EXPIRATION_CRON = '*/5 * * * *';

export const rfqQueue = new Queue(RFQ_EXPIRATION_QUEUE, { connection: queueRedis });
