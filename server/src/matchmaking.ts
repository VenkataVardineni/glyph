import type { Redis } from "ioredis";
import { areUsersBlockedPair } from "./safety.js";

export type MatchPrefs = {
  tags: string[];
  language: string;
  drawingOnly: boolean;
  userId: string;
  excludeUserIds?: string[];
};

export type QueuedUser = MatchPrefs & {
  socketId: string;
  joinedAt: number;
};

export function queueKey(prefs: MatchPrefs): string {
  const tagPart =
    prefs.tags.length > 0
      ? [...prefs.tags].sort().join(",").slice(0, 120)
      : "_open";
  return `${prefs.language}|${prefs.drawingOnly ? "draw" : "full"}|${tagPart}`;
}

export function tagScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map((t) => t.toLowerCase()));
  return a.filter((t) => setB.has(t.toLowerCase())).length;
}

export async function findPeer(
  queue: Map<string, QueuedUser[]>,
  incoming: QueuedUser,
  redis: Redis | null
): Promise<QueuedUser | null> {
  const key = queueKey(incoming);
  const bucket = queue.get(key) ?? [];
  if (bucket.length === 0) {
    queue.set(key, bucket);
    return null;
  }
  let bestIdx = -1;
  let bestScore = -1;
  for (let i = 0; i < bucket.length; i++) {
    const cand = bucket[i];
    if (cand.socketId === incoming.socketId || cand.userId === incoming.userId) continue;
    if (incoming.excludeUserIds?.includes(cand.userId)) continue;
    if (cand.excludeUserIds?.includes(incoming.userId)) continue;
    if (await areUsersBlockedPair(incoming.userId, cand.userId, redis)) continue;
    const s = tagScore(incoming.tags, cand.tags);
    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }
  if (bestIdx < 0) {
    for (let i = 0; i < bucket.length; i++) {
      const cand = bucket[i];
      if (cand.socketId === incoming.socketId || cand.userId === incoming.userId) continue;
      if (incoming.excludeUserIds?.includes(cand.userId)) continue;
      if (cand.excludeUserIds?.includes(incoming.userId)) continue;
      if (await areUsersBlockedPair(incoming.userId, cand.userId, redis)) continue;
      bestIdx = i;
      break;
    }
  }
  if (bestIdx < 0) return null;
  const [peer] = bucket.splice(bestIdx, 1);
  if (bucket.length === 0) queue.delete(key);
  return peer;
}
