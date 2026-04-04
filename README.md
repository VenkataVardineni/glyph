# Glyph

Live random matching with shared video and AR-style drawing. **Expo (React Native)** client + **Node** signaling server (Fastify + Socket.IO).

## Layout

| Path | Role |
|------|------|
| `mobile/` | Expo Router app, WebRTC, lobby → canvas flow |
| `server/` | Matchmaking, reports/blocks, admin API, review login |
| `legal/` | EULA / privacy templates and App Store copy |
| `docs/` | Checklists and internal notes |

## Quick start

1. **Server:** `cd server && npm install && cp .env.example .env && npm run dev`
2. **Mobile:** `cd mobile && npm install && CI=false npm start`  
   Dev client: `npx expo run:ios` / `run:android` (not Expo Go; native WebRTC).

Point the app at your server with `EXPO_PUBLIC_SERVER_URL` (see `mobile/app.config.js` → `extra.serverUrl`).

## License

See repository files; add a `LICENSE` if you open-source publicly.
