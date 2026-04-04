import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Redis } from "ioredis";
import { Server, Socket } from "socket.io";
import { adminDashboardHtml } from "./adminDashboard.js";
import {
  addBlock,
  areUsersBlockedPair,
  banUser,
  isUserBanned,
  loadBannedFromRedis,
} from "./safety.js";

const PORT = Number(process.env.PORT) || 3001;
const REDIS_URL = process.env.REDIS_URL;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";
const REVIEW_DEMO_USERNAME = process.env.REVIEW_DEMO_USERNAME ?? "";
const REVIEW_DEMO_PASSWORD = process.env.REVIEW_DEMO_PASSWORD ?? "";
const REVIEW_DEMO_USER_ID = process.env.REVIEW_DEMO_USER_ID ?? "glyph-apple-review";

type MatchPrefs = {
  tags: string[];
  language: string;
  drawingOnly: boolean;
  userId: string;
  /** Client hint: never match these user IDs (e.g. locally blocked before server sync). */
  excludeUserIds?: string[];
};

type QueuedUser = MatchPrefs & {
  socketId: string;
  joinedAt: number;
};

type ActiveMatch = {
  id: string;
  a: string;
  b: string;
  aUserId: string;
  bUserId: string;
  createdAt: number;
};

function queueKey(prefs: MatchPrefs): string {
  const tagPart =
    prefs.tags.length > 0
      ? [...prefs.tags].sort().join(",").slice(0, 120)
      : "_open";
  return `${prefs.language}|${prefs.drawingOnly ? "draw" : "full"}|${tagPart}`;
}

function tagScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map((t) => t.toLowerCase()));
  return a.filter((t) => setB.has(t.toLowerCase())).length;
}

async function findPeer(
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

function peerUserIdForSocket(m: ActiveMatch, socketId: string): string | null {
  if (m.a === socketId) return m.bUserId;
  if (m.b === socketId) return m.aUserId;
  return null;
}

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true, service: "glyph-signal" }));

app.post<{
  Body: { username?: string; password?: string };
}>("/auth/review-login", async (request, reply) => {
  if (!REVIEW_DEMO_USERNAME || !REVIEW_DEMO_PASSWORD) {
    return reply.code(503).send({
      ok: false,
      message: "Review login not configured. Set REVIEW_DEMO_USERNAME and REVIEW_DEMO_PASSWORD on the server.",
    });
  }
  const { username, password } = request.body ?? {};
  if (username !== REVIEW_DEMO_USERNAME || password !== REVIEW_DEMO_PASSWORD) {
    return reply.code(401).send({ ok: false, message: "Invalid credentials" });
  }
  return { ok: true, userId: REVIEW_DEMO_USER_ID };
});

function assertAdmin(authHeader: string | undefined): boolean {
  if (!ADMIN_TOKEN) return false;
  const v = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return v === ADMIN_TOKEN;
}

app.get("/admin/dashboard", async (_request, reply) => {
  reply.type("text/html").send(adminDashboardHtml());
});

app.get("/admin/api/reports", async (request, reply) => {
  if (!assertAdmin(request.headers.authorization)) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
  if (!redis) {
    return { reports: memReports };
  }
  const raw = await redis.lrange("glyph:reports", 0, 199);
  const reports = raw.map((r) => {
    try {
      return JSON.parse(r) as Record<string, unknown>;
    } catch {
      return { raw: r };
    }
  });
  return { reports };
});

app.post<{
  Body: { userId?: string };
}>("/admin/api/ban", async (request, reply) => {
  if (!assertAdmin(request.headers.authorization)) {
    return reply.code(401).send({ message: "Unauthorized" });
  }
  const userId = request.body?.userId?.trim();
  if (!userId) return reply.code(400).send({ message: "userId required" });
  await banUser(userId, redis);
  app.log.warn({ userId }, "admin_ban");
  kickSocketsForUser(userId, "banned_by_admin");
  return { ok: true, userId };
});

let redis: Redis | null = null;
/** In-memory reports when Redis is disabled (dev only). */
const memReports: Record<string, unknown>[] = [];

if (REDIS_URL) {
  redis = new Redis(REDIS_URL);
  redis.on("error", (e: Error) => app.log.error({ err: e }, "redis error"));
  await loadBannedFromRedis(redis);
}

const queues = new Map<string, QueuedUser[]>();
const socketToUser = new Map<string, string>();
const socketToMatch = new Map<string, string>();
const matches = new Map<string, ActiveMatch>();
const userSockets = new Map<string, Set<string>>();

function totalQueued(): number {
  let n = 0;
  for (const b of queues.values()) n += b.length;
  return n;
}

function leaveAllQueues(socketId: string) {
  for (const [k, bucket] of queues.entries()) {
    const next = bucket.filter((u) => u.socketId !== socketId);
    if (next.length === 0) queues.delete(k);
    else queues.set(k, next);
  }
}

function bindUserSocket(userId: string, socketId: string) {
  let set = userSockets.get(userId);
  if (!set) {
    set = new Set();
    userSockets.set(userId, set);
  }
  set.add(socketId);
}

function unbindUserSocket(userId: string, socketId: string) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSockets.delete(userId);
}

function peerSocketId(match: ActiveMatch, socketId: string): string | null {
  if (match.a === socketId) return match.b;
  if (match.b === socketId) return match.a;
  return null;
}

/**
 * Production: ONNX / cloud vision on sampled keyframes. Must run continuously for App Review notes.
 */
async function scoreVisualSafety(_payload: {
  userId: string;
  frameId: string;
}): Promise<{ safe: boolean; score: number }> {
  return { safe: true, score: 0.02 };
}

/**
 * Production: streaming ASR windows + text safety classifier.
 */
async function scoreAudioSafety(_payload: {
  userId: string;
  transcriptSnippet: string;
}): Promise<{ safe: boolean; score: number }> {
  return { safe: true, score: 0.01 };
}

async function pushReport(entry: Record<string, unknown>) {
  const line = JSON.stringify(entry);
  if (redis) await redis.lpush("glyph:reports", line);
  else memReports.unshift(entry);
}

let io: Server;

app.get("/stats", async () => ({
  online: io.engine.clientsCount,
  queued: totalQueued(),
  matches: matches.size,
}));

await app.ready();
io = new Server(app.server, {
  cors: { origin: true, methods: ["GET", "POST"] },
  transports: ["websocket", "polling"],
});

function emitToSocket(socketId: string, event: string, data: unknown) {
  io.to(socketId).emit(event, data);
}

io.on("connection", (socket: Socket) => {
  app.log.info({ id: socket.id }, "socket connected");

  socket.on(
    "authenticate",
    async (msg: { userId?: string }, cb?: (r: { ok: boolean; code?: string }) => void) => {
      const userId = msg?.userId?.trim() || randomUUID();
      if (await isUserBanned(userId, redis)) {
        socket.emit("auth_error", { code: "BANNED" });
        cb?.({ ok: false, code: "BANNED" });
        socket.disconnect(true);
        return;
      }
      socketToUser.set(socket.id, userId);
      bindUserSocket(userId, socket.id);
      void redis?.incr("glyph:stats:connections");
      void redis?.expire("glyph:stats:connections", 3600);
      cb?.({ ok: true });
      socket.emit("authenticated", { userId });
    }
  );

  socket.on("join_queue", async (prefs: MatchPrefs) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) {
      socket.emit("error_msg", { code: "AUTH", message: "Authenticate first" });
      return;
    }
    if (await isUserBanned(userId, redis)) {
      socket.emit("auth_error", { code: "BANNED" });
      socket.disconnect(true);
      return;
    }
    leaveAllQueues(socket.id);
    const me: QueuedUser = {
      socketId: socket.id,
      userId,
      tags: (prefs.tags ?? []).slice(0, 3).map((t) => t.replace(/^#/, "")),
      language: prefs.language || "any",
      drawingOnly: Boolean(prefs.drawingOnly),
      joinedAt: Date.now(),
      excludeUserIds: (prefs.excludeUserIds ?? []).slice(0, 200),
    };
    const peer = await findPeer(queues, me, redis);
    if (!peer) {
      const key = queueKey(me);
      const bucket = queues.get(key) ?? [];
      bucket.push(me);
      queues.set(key, bucket);
      socket.emit("queue_status", { position: bucket.length });
      return;
    }
    const matchId = randomUUID();
    const match: ActiveMatch = {
      id: matchId,
      a: peer.socketId,
      b: socket.id,
      aUserId: peer.userId,
      bUserId: me.userId,
      createdAt: Date.now(),
    };
    matches.set(matchId, match);
    socketToMatch.set(peer.socketId, matchId);
    socketToMatch.set(socket.id, matchId);
    emitToSocket(peer.socketId, "matched", {
      matchId,
      isOfferer: true,
      peerUserId: me.userId,
      prefs: {
        tags: peer.tags,
        language: peer.language,
        drawingOnly: peer.drawingOnly,
      },
    });
    socket.emit("matched", {
      matchId,
      isOfferer: false,
      peerUserId: peer.userId,
      prefs: { tags: me.tags, language: me.language, drawingOnly: me.drawingOnly },
    });
  });

  socket.on("leave_queue", () => {
    leaveAllQueues(socket.id);
    socket.emit("queue_status", { position: 0 });
  });

  socket.on(
    "signal",
    (msg: { matchId: string; type: string; sdp?: string; candidate?: unknown }) => {
      const mid = socketToMatch.get(socket.id);
      if (!mid || mid !== msg.matchId) return;
      const m = matches.get(mid);
      if (!m) return;
      const peer = peerSocketId(m, socket.id);
      if (!peer) return;
      emitToSocket(peer, "signal", { ...msg, from: socket.id });
    }
  );

  socket.on(
    "stroke",
    (msg: {
      matchId: string;
      strokeId: string;
      points: { x: number; y: number }[];
      color: string;
      width: number;
      brush: string;
    }) => {
      const mid = socketToMatch.get(socket.id);
      if (!mid || mid !== msg.matchId) return;
      const m = matches.get(mid);
      if (!m) return;
      const peer = peerSocketId(m, socket.id);
      if (!peer) return;
      emitToSocket(peer, "stroke", msg);
    }
  );

  socket.on(
    "wave_ready",
    (msg: { matchId: string; ready: boolean }, cb?: () => void) => {
      const mid = socketToMatch.get(socket.id);
      if (!mid || mid !== msg.matchId) return;
      const m = matches.get(mid);
      if (!m) return;
      const peer = peerSocketId(m, socket.id);
      if (peer) emitToSocket(peer, "peer_wave", { ready: msg.ready });
      cb?.();
    }
  );

  socket.on("block_user", async (msg: { matchId: string; peerUserId: string }) => {
    const myId = socketToUser.get(socket.id);
    if (!myId || !msg.peerUserId) return;
    const mid = socketToMatch.get(socket.id);
    if (!mid || mid !== msg.matchId) return;
    const m = matches.get(mid);
    if (!m) return;
    const expectedPeer = peerUserIdForSocket(m, socket.id);
    if (expectedPeer !== msg.peerUserId) return;
    await addBlock(myId, msg.peerUserId, redis);
    app.log.warn({ blocker: myId, blocked: msg.peerUserId }, "user_block");
    void pushReport({
      at: Date.now(),
      type: "block",
      reporterUserId: myId,
      reportedUserId: msg.peerUserId,
      matchId: msg.matchId,
    });
    const peerSock = peerSocketId(m, socket.id);
    if (peerSock) emitToSocket(peerSock, "peer_disconnected", { reason: "blocked" });
    cleanupMatch(mid);
    socket.emit("blocked_ok", { peerUserId: msg.peerUserId });
  });

  socket.on("icebreaker_request", (msg: { matchId: string }) => {
    const mid = socketToMatch.get(socket.id);
    if (!mid || mid !== msg.matchId) return;
    const prompts = [
      "Both draw a cat in the air in 10 seconds.",
      "Trace a heart together using two colors.",
      "Spell your initials — the other person guesses.",
      "Draw your mood as a single squiggle.",
    ];
    const text = prompts[Math.floor(Math.random() * prompts.length)];
    const m = matches.get(mid);
    if (!m) return;
    emitToSocket(m.a, "icebreaker", { text });
    emitToSocket(m.b, "icebreaker", { text });
  });

  socket.on(
    "moderation_frame",
    async (
      msg: { frameId: string },
      cb?: (r: { safe: boolean; action: "none" | "blur" | "disconnect" }) => void
    ) => {
      const userId = socketToUser.get(socket.id) ?? "anon";
      const res = await scoreVisualSafety({ userId, frameId: msg.frameId });
      const action = !res.safe
        ? res.score > 0.9
          ? "disconnect"
          : "blur"
        : "none";
      cb?.({ safe: res.safe, action });
      if (!res.safe && action === "disconnect") {
        socket.emit("moderation_violation", { channel: "visual", action });
        const mid = socketToMatch.get(socket.id);
        if (mid) {
          const m = matches.get(mid);
          if (m) {
            const peer = peerSocketId(m, socket.id);
            if (peer)
              emitToSocket(peer, "peer_disconnected", { reason: "moderation" });
          }
          cleanupMatch(mid);
        }
      }
    }
  );

  socket.on(
    "moderation_audio",
    async (
      msg: { text: string },
      cb?: (r: { safe: boolean; warn: boolean }) => void
    ) => {
      const userId = socketToUser.get(socket.id) ?? "anon";
      const res = await scoreAudioSafety({ userId, transcriptSnippet: msg.text });
      cb?.({ safe: res.safe, warn: !res.safe });
    }
  );

  socket.on(
    "report",
    (msg: {
      matchId?: string;
      reason: string;
      reportedUserId?: string;
    }) => {
      const reporterUserId = socketToUser.get(socket.id);
      const mid = msg.matchId ?? socketToMatch.get(socket.id);
      let reportedUserId = msg.reportedUserId;
      if (!reportedUserId && mid) {
        const m = matches.get(mid);
        if (m) reportedUserId = peerUserIdForSocket(m, socket.id) ?? undefined;
      }
      app.log.warn(
        { socket: socket.id, reporterUserId, reportedUserId, ...msg },
        "user_report"
      );
      void pushReport({
        at: Date.now(),
        reporterUserId,
        reportedUserId,
        matchId: mid,
        reason: msg.reason,
        socketId: socket.id,
      });
    }
  );

  socket.on("disconnect_match", () => {
    const mid = socketToMatch.get(socket.id);
    if (!mid) return;
    const m = matches.get(mid);
    if (m) {
      const peer = peerSocketId(m, socket.id);
      if (peer) emitToSocket(peer, "peer_disconnected", { reason: "user" });
    }
    cleanupMatch(mid);
  });

  socket.on("disconnect", () => {
    const userId = socketToUser.get(socket.id);
    if (userId) unbindUserSocket(userId, socket.id);
    leaveAllQueues(socket.id);
    const mid = socketToMatch.get(socket.id);
    if (mid) {
      const m = matches.get(mid);
      if (m) {
        const peer = peerSocketId(m, socket.id);
        if (peer) emitToSocket(peer, "peer_disconnected", { reason: "user" });
      }
      cleanupMatch(mid);
    }
    socketToUser.delete(socket.id);
  });
});

function cleanupMatch(matchId: string) {
  const m = matches.get(matchId);
  if (!m) return;
  socketToMatch.delete(m.a);
  socketToMatch.delete(m.b);
  matches.delete(matchId);
}

function kickSocketsForUser(userId: string, reason: string) {
  const set = userSockets.get(userId);
  if (!set) return;
  for (const sid of set) {
    const s = io.sockets.sockets.get(sid);
    if (s) {
      s.emit("auth_error", { code: "BANNED", reason });
      s.disconnect(true);
    }
  }
}

/** Dual-stack: IPv6 (Apple review) + IPv4 where supported. */
await app.listen({ port: PORT, host: "::" });
app.log.info(`Glyph signal on [::]:${PORT} (IPv6 dual-stack where supported)`);
