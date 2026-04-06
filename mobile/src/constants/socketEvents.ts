/** Server ↔ client Socket.IO event names (single source of truth). */
export const SocketEvents = {
  authenticate: "authenticate",
  authenticated: "authenticated",
  authError: "auth_error",
  queueStatus: "queue_status",
  matched: "matched",
  peerWave: "peer_wave",
  icebreaker: "icebreaker",
  stroke: "stroke",
  peerDisconnected: "peer_disconnected",
  moderationViolation: "moderation_violation",
  blockedOk: "blocked_ok",
} as const;
