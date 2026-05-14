import Redis from 'ioredis';
import { logger } from '$lib/server/logger';

const url = process.env.REDIS_URL;
const isProd = process.env.NODE_ENV === 'production';

function createClient(connectionUrl: string): Redis {
	const client = new Redis(connectionUrl, {
		maxRetriesPerRequest: 3,
		enableReadyCheck: true
	});
	client.on('error', (err) => {
		logger.error({ err: err.message }, 'redis client error');
	});
	return client;
}

export const redis: Redis | null = url ? createClient(url) : null;

if (!redis) {
	if (isProd) {
		logger.error('REDIS_URL not set in production');
	} else {
		logger.warn('REDIS_URL not set — Redis-backed features disabled (dev)');
	}
}
