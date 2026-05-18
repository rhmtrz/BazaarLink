import 'dotenv/config';
import Redis from 'ioredis';
import { logger } from '$lib/server/logger';

const url = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const queueRedis = new Redis(url, {
	maxRetriesPerRequest: null,
	enableReadyCheck: false
});

queueRedis.on('error', (err) => {
	logger.error({ err: err.message }, 'queue redis client error');
});
