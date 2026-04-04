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

## Scripts

- `npm run dev` — `tsx watch` for development
- `npm run build` — compile to `dist/`
- `npm run start` — run compiled output
- `npm run typecheck` — `tsc --noEmit`
