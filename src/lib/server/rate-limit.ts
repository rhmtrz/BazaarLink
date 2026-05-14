import { error } from '@sveltejs/kit';
import { redis } from '$lib/server/redis';
import { logger } from '$lib/server/logger';

const isProd = process.env.NODE_ENV === 'production';

// Sliding window log via sorted set. Atomic by Redis's single-threaded
// execution. A monotonic INCR counter provides unique sorted-set members
// so same-ms attempts don't collapse to one entry.
const SCRIPT = `
local key = KEYS[1]
local seqKey = key .. ':seq'
local limit = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local windowMs = tonumber(ARGV[3])
local cutoff = now - windowMs

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)
if count >= limit then
	return 0
end
local id = redis.call('INCR', seqKey)
redis.call('PEXPIRE', seqKey, windowMs)
redis.call('ZADD', key, now, id)
redis.call('PEXPIRE', key, windowMs)
return 1
`;

let warnedAboutMissingRedis = false;

export async function enforceRateLimit(
	key: string,
	limit: number,
	windowMs: number
): Promise<void> {
	if (!redis) {
		if (isProd) throw error(503, 'Rate limiter unavailable');
		if (!warnedAboutMissingRedis) {
			warnedAboutMissingRedis = true;
			logger.warn({ key }, 'rate-limit skipped: Redis not configured (dev)');
		}
		return;
	}

	let allowed: number;
	try {
		allowed = (await redis.eval(
			SCRIPT,
			1,
			key,
			String(limit),
			String(Date.now()),
			String(windowMs)
		)) as number;
	} catch (err) {
		if (isProd) {
			logger.error({ err, key }, 'rate-limit redis error');
			throw error(503, 'Rate limiter unavailable');
		}
		if (!warnedAboutMissingRedis) {
			warnedAboutMissingRedis = true;
			logger.warn({ err, key }, 'rate-limit skipped: Redis unreachable (dev)');
		}
		return;
	}

	if (allowed === 0) throw error(429, 'Too many attempts. Please slow down.');
}
