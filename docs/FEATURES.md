# Feature matrix

| Area | Feature | Implementation |
|------|---------|----------------|
| **Matching** | Tag-aware queue buckets | `server/src/matchmaking.ts` — `queueKey`, `tagScore`, `findPeer` |
| **Matching** | Block / ban aware pairing | Redis or in-memory sets via `safety.ts` |
| **Realtime** | Socket.IO + WebSocket-first | `socket.io` server + `socket.io-client` with tuned reconnect |
| **Media** | Peer video | `react-native-webrtc` + `getUserMedia`; STUN/TURN in `mobile/src/lib/webrtc.ts` |
| **Media** | Lobby preview | `expo-camera` `CameraView` (`mode="video"`, focus-gated `active`) |
| **Drawing** | Synced strokes | Socket event `stroke`; local `drawingStore` + remote merge |
| **UX** | Wave to unblur (optional) | `wave_ready` / `peer_wave` + session flag |
| **Safety** | Report queue | `report` → Redis list or memory; admin JSON API |
| **Safety** | Block peer | `block_user` + `glyph:blocked:*` keys |
| **Safety** | Moderation stubs | `moderation_frame` / `moderation_audio` callbacks (wire ML in production) |
| **Ops** | Admin dashboard HTML | `GET /admin/dashboard` + Bearer `ADMIN_TOKEN` APIs |
| **Ops** | Apple review login | `POST /auth/review-login` + env demo credentials |
| **Ops** | Health & stats | `/health` (uptime), `/stats` (online, queue depth, active matches) |
| **Security** | Payload validation | Zod schemas in `server/src/validation/socketSchemas.ts` |
| **Security** | HTTP hardening | `@fastify/helmet`, `@fastify/rate-limit`, configurable CORS |
