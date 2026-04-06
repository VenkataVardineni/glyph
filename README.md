# Glyph

**Glyph** is a live random-video matching app with a shared **AR-style drawing layer**: think short-session social video plus synchronized strokes over the same match. The product is split into an **Expo (React Native)** client and a **Node.js** signaling server (**Fastify** + **Socket.IO**).

This repo is structured for **App Store–style** delivery: onboarding with safety + EULA, optional Apple review login, moderation **hooks** (stubs today), report/block/ban flows, and an **admin** HTML dashboard.

---

## What it does (features)

| Theme | Capability |
|-------|------------|
| **Matching** | Queue by **language**, **full vs drawing-only camera**, and up to **three tags**; prefers peers with overlapping tags. |
| **Video** | **WebRTC** peer video (`react-native-webrtc`); lobby uses **expo-camera** preview behind a dimmed overlay. |
| **Drawing** | Local + remote **vector strokes** over video; palette / brush metadata sent as Socket.IO messages. |
| **Safety UX** | **Report** and **block** from the canvas; blocks affect **future** matchmaking (server-side set). |
| **Moderation (extensible)** | Periodic **`moderation_frame`** / **`moderation_audio`** callbacks — currently **stub scorers** ready to swap for CV / NLP. |
| **Trust & safety ops** | **Reports queue** (Redis list or in-memory dev), **admin** bearer APIs, **ban** with socket kick. |
| **Apple review** | **`POST /auth/review-login`** for a fixed demo account when env vars are set. |
| **Networking** | Server listens on **`::`** (IPv6 dual-stack) for store compliance notes; client socket uses tuned **reconnect** backoff. |
| **Hardening** | **Zod** validation on socket payloads, **Helmet**, **rate limiting**, configurable **CORS**, **graceful shutdown**. |

More detail: [`docs/FEATURES.md`](docs/FEATURES.md).

---

## User & technical flow

1. **App start** — Zustand **`sessionStore`** hydrates from **AsyncStorage** (user id, onboarding flags, EULA version, settings).
2. **Onboarding** — Sign-in (anonymous or review demo) → safety screen → EULA → gesture tutorial → **lobby**.
3. **Lobby** — Camera permission; user edits **tags** / **language** / **drawing-only**; taps **Connect**.
4. **Socket** — `authenticate` then `join_queue`. Server either enqueues or **immediately matches** within the same bucket.
5. **Match** — Both clients receive **`matched`** with `matchId` and **`isOfferer`** for WebRTC. **SDP** and **ICE** flow through the **`signal`** event on the same socket.
6. **Canvas** — Split **video panes**, **DrawingLayer**, optional **wave-to-unblur**, **icebreaker** prompts, **leave** gesture.
7. **Disconnect** — `disconnect_match` or peer drop cleans up match state and notifies the other side.

Sequence-style diagram: [`docs/USER_FLOW.md`](docs/USER_FLOW.md).

---

## How it is implemented

### Mobile (`mobile/`)

- **Expo Router** file routes: `app/(main)/lobby`, `canvas`, `settings`, `glyphs`; `app/onboarding/*`.
- **State:** `zustand` stores for session, match, drawing, glyphs.
- **Realtime:** `useGlyphSocket` creates **`socket.io-client`** with reconnection limits; event names live in **`src/constants/socketEvents.ts`**.
- **WebRTC:** `useGlyphCall` + **`getUserMedia`** when a match exists; STUN/TURN in **`src/lib/webrtc.ts`**.
- **Resilience:** **`ErrorBoundary`** wraps the navigation tree; **`fetchOnlineCount`** polls **`/stats`** for the lobby pill.
- **Native:** Requires **dev client** / prebuild (**not Expo Go**) because of **WebRTC**.

### Server (`server/`)

- **`index.ts`** — HTTP routes, Redis wiring, Socket.IO attachment, event handlers, shutdown.
- **`matchmaking.ts`** — `queueKey`, `tagScore`, `findPeer` (tag-weighted peer choice, then first eligible).
- **`safety.ts`** — Ban + block storage (Redis or memory).
- **`validation/socketSchemas.ts`** — Zod schemas; invalid payloads are dropped or answered with **`error_msg`** / empty callback as appropriate.
- **`adminDashboard.ts`** — Minimal HTML for triaging reports.

Socket contract tables: [`docs/SOCKET_API.md`](docs/SOCKET_API.md).

### Legal & store (`legal/`, `APP_STORE_REVIEW_NOTES.txt`)

Templates and reviewer copy — replace placeholder URLs before production.

---

## Repository layout

| Path | Role |
|------|------|
| `mobile/` | Expo app |
| `server/` | Signal + match + admin API |
| `legal/` | EULA / privacy / reviewer text |
| `docs/` | Flow, features, architecture, socket reference |
| `docker-compose.yml` | Optional **Redis** for persistence |
| `.github/workflows/ci.yml` | Server **typecheck** + **tests** on push/PR |

---

## Quick start

**Requirements:** Node **20** (see `.nvmrc`), npm, Xcode or Android toolchain for native builds.

```bash
# Terminal 1 — API + sockets
cd server && npm install && cp .env.example .env && npm run dev

# Terminal 2 — Metro
cd mobile && npm install && npm start

# Terminal 3 — native run (after Metro is up)
cd mobile && npx expo run:ios   # or run:android
```

Optional Redis: `docker compose up -d` then set `REDIS_URL=redis://127.0.0.1:6379` in `server/.env`.

**Physical device:** set `EXPO_PUBLIC_SERVER_URL` to your machine’s LAN IP and port **3001**.

---

## Scripts (root)

```bash
npm run server       # dev server
npm run mobile       # Metro
npm run test:server  # Vitest in server/
```

---

## CI

GitHub Actions runs **`npm ci`**, **`npm run typecheck`**, and **`npm test`** in `server/` on pushes and PRs to `main`.

---

## License

[MIT](LICENSE).

---

## Further reading

- [Architecture (diagram + deployment)](docs/ARCHITECTURE.md)
- [Contributing](CONTRIBUTING.md)
- [Performance / QA checklist](docs/PERFORMANCE_QA_CHECKLIST.md)
