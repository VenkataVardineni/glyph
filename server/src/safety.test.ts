import { describe, expect, it } from "vitest";
import { addBlock, areUsersBlockedPair } from "./safety.js";

describe("in-memory blocks", () => {
  it("detects when either user blocked the other", async () => {
    const a = `test-a-${Date.now()}`;
    const b = `test-b-${Date.now()}`;
    expect(await areUsersBlockedPair(a, b, null)).toBe(false);
    await addBlock(a, b, null);
    expect(await areUsersBlockedPair(a, b, null)).toBe(true);
    // Pair check is symmetric: if a blocked b, matching is blocked from either side.
    expect(await areUsersBlockedPair(b, a, null)).toBe(true);
    await addBlock(b, a, null);
    expect(await areUsersBlockedPair(b, a, null)).toBe(true);
  });
});
