# Glyph mobile

Expo SDK 54, Expo Router, dev client + `react-native-webrtc`.

## Requirements

- Node 20+
- Xcode (iOS) or Android Studio (Android)
- `expo-dev-client` (this project is not supported in Expo Go)

## Commands

```bash
npm install
CI=false npm start          # Metro on localhost (avoids CI/non-interactive mode)
npx expo run:ios            # build + simulator
npx expo prebuild           # regenerate ios/ android/ when native config changes
```

## Env

Override the signal server URL when building or via env:

```bash
EXPO_PUBLIC_SERVER_URL=http://YOUR_LAN_IP:3001 npx expo run:ios
```

Default in `app.config.js` is `http://127.0.0.1:3001` (simulator → host loopback).

## Reliability

- Root **ErrorBoundary** catches render failures and offers a reset.
- **Socket event names** are centralized in `src/constants/socketEvents.ts`.
- **Reconnect tuning** — `socket.io-client` uses bounded backoff (`useGlyphSocket`).

## Simulator camera

iOS Simulator has no real camera feed. Use **Features → Camera** in Simulator, or test on a physical device.
