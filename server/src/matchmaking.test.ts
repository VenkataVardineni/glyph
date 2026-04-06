import { describe, expect, it } from "vitest";
import { findPeer, queueKey, tagScore, type QueuedUser } from "./matchmaking.js";

describe("tagScore", () => {
  it("counts case-insensitive tag overlap", () => {
    expect(tagScore(["Art", "Chill"], ["chill", "music"])).toBe(1);
    expect(tagScore([], ["a"])).toBe(0);
    expect(tagScore(["x"], ["X", "y"])).toBe(1);
  });
});

describe("queueKey", () => {
  it("sorts tags for stable bucket keys", () => {
    expect(
      queueKey({
        tags: ["zebra", "apple"],
        language: "en",
        drawingOnly: false,
        userId: "u",
      })
    ).toBe("en|full|apple,zebra");
  });

  it("uses _open when no tags", () => {
    expect(
      queueKey({ tags: [], language: "any", drawingOnly: true, userId: "u" })
    ).toBe("any|draw|_open");
  });
});

describe("findPeer", () => {
  it("pairs two compatible users in same bucket", async () => {
    const q = new Map<string, QueuedUser[]>();
    const a: QueuedUser = {
      socketId: "s1",
      userId: "u1",
      tags: ["art"],
      language: "en",
      drawingOnly: false,
      joinedAt: 1,
    };
    const b: QueuedUser = {
      socketId: "s2",
      userId: "u2",
      tags: ["art"],
      language: "en",
      drawingOnly: false,
      joinedAt: 2,
    };
    const first = await findPeer(q, a, null);
    expect(first).toBeNull();
    const key = queueKey(a);
    q.set(key, [a]);
    const peer = await findPeer(q, b, null);
    expect(peer?.userId).toBe("u1");
    expect(q.get(key)?.length ?? 0).toBe(0);
  });
});
