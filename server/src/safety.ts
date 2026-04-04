import type { Redis } from "ioredis";

/** In-memory cache of banned user IDs (mirrors Redis set `glyph:banned`). */
const memBanned = new Set<string>();
/** Used only when `redis` is null. */
const memBlocked = new Map<string, Set<string>>();

export async function loadBannedFromRedis(redis: Redis | null): Promise<void> {
  if (!redis) return;
  const ids = await redis.smembers("glyph:banned");
  for (const id of ids) memBanned.add(id);
}

export async function isUserBanned(userId: string, redis: Redis | null): Promise<boolean> {
  if (redis) return (await redis.sismember("glyph:banned", userId)) === 1;
  return memBanned.has(userId);
}

export async function banUser(userId: string, redis: Redis | null): Promise<void> {
  if (redis) await redis.sadd("glyph:banned", userId);
  memBanned.add(userId);
}

export async function addBlock(
  blockerUserId: string,
  blockedUserId: string,
  redis: Redis | null
): Promise<void> {
  if (redis) await redis.sadd(`glyph:blocked:${blockerUserId}`, blockedUserId);
  else {
    let s = memBlocked.get(blockerUserId);
    if (!s) {
      s = new Set();
      memBlocked.set(blockerUserId, s);
    }
    s.add(blockedUserId);
  }
}

export async function areUsersBlockedPair(
  aUserId: string,
  bUserId: string,
  redis: Redis | null
): Promise<boolean> {
  if (redis) {
    const [x, y] = await Promise.all([
      redis.sismember(`glyph:blocked:${aUserId}`, bUserId),
      redis.sismember(`glyph:blocked:${bUserId}`, aUserId),
    ]);
    return x === 1 || y === 1;
  }
  return Boolean(memBlocked.get(aUserId)?.has(bUserId) || memBlocked.get(bUserId)?.has(aUserId));
}
