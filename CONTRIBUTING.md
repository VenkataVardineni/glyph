# Contributing

## Workflow

1. Fork or branch from `main`.
2. Prefer **one logical change per commit** (easier review and bisect).
3. Before opening a PR:
   - **Server:** `cd server && npm run typecheck && npm test`
   - **Mobile:** `cd mobile && npx tsc --noEmit`

## Monorepo shortcuts (root)

```bash
npm run server    # same as npm run dev --prefix server
npm run mobile    # same as npm start --prefix mobile
npm run test:server
```

## Commits

Use short, imperative subjects, e.g. `fix(lobby): resume camera on focus`.

## Security

Do not commit real `ADMIN_TOKEN`, Redis URLs with passwords, or Apple review credentials. Use `.env` locally and CI secrets in automation.

## Documentation

- User-visible flow: `docs/USER_FLOW.md`
- Feature inventory: `docs/FEATURES.md`
- Socket contract: `docs/SOCKET_API.md`
- System shape: `docs/ARCHITECTURE.md`
