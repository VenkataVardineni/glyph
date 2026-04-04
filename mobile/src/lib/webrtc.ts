/* eslint-disable @typescript-eslint/no-explicit-any */
export type RTCModule = typeof import("react-native-webrtc");

let cached: RTCModule | null | false = false;

export function getRTC(): RTCModule | null {
  if (cached !== false) return cached;
  try {
    // Native dev build only — Expo Go will not load this module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require("react-native-webrtc") as RTCModule;
  } catch {
    cached = null;
  }
  return cached;
}

export const ICE_SERVERS: any[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
