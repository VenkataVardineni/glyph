# Glyph server

Signaling + matchmaking for the mobile app. **Fastify** HTTP API, **Socket.IO** for real-time events.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Listens on `PORT` (default **3001**), `host ::` for IPv6 dual-stack where supported.

## Env (see `.env.example`)

| Variable | Purpose |
|----------|---------|
| `PORT` | HTTP + Socket.IO port |
| `REDIS_URL` | Optional; blocks/reports persistence |
| `ADMIN_TOKEN` | Bearer token for `/admin/*` |
| `REVIEW_DEMO_*` | Apple review demo login |
| `CORS_ORIGIN` | Comma-separated allowed HTTP origins (default: reflect `Origin`) |

## Security

- **Helmet** — security-oriented HTTP headers (CSP disabled for HTML admin dashboard).
- **Rate limiting** — global Fastify limiter (burst-friendly defaults).
- **Zod** — all primary Socket.IO payloads are validated before handlers run.
- **Graceful shutdown** — `SIGINT` / `SIGTERM` closes Socket.IO, Redis, and Fastify cleanly.

## Scripts

- `npm run dev` — `tsx watch` for development
- `npm run build` — compile to `dist/`
- `npm run start` — run compiled output
- `npm run typecheck` — `tsc --noEmit`
- `npm test` / `npm run test:watch` — Vitest unit tests

## Tests

```bash
npm test
```

Matchmaking and in-memory safety helpers are covered; add integration tests with a running Redis for production confidence.
