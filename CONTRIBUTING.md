# Contributing

## Workflow

1. Fork or branch from `main`.
2. Keep changes scoped to one concern per commit when possible.
3. Run checks before opening a PR:
   - **Server:** `cd server && npm run typecheck`
   - **Mobile:** `cd mobile && npx tsc --noEmit` (if configured; otherwise rely on IDE)

## Commits

Use short, imperative subjects, e.g. `fix(lobby): resume camera on focus`.

## Security

Do not commit real `ADMIN_TOKEN`, Redis URLs with passwords, or Apple review credentials. Use `.env` locally and CI secrets in automation.
