import type { MediaStream as RNMediaStream } from "react-native-webrtc";
import type { Socket } from "socket.io-client";
import { create } from "zustand";

export type StrokeMsg = {
  matchId: string;
  strokeId: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  brush: string;
};

type MatchState = {
  socket: Socket | null;
  connected: boolean;
  queued: boolean;
  queuePosition: number;
  matchId: string | null;
  isOfferer: boolean | null;
  peerUserId: string | null;
  peerUserLabel: string;
  localWaveReady: boolean;
  remoteWaveReady: boolean;
  icebreaker: string | null;
  remoteStream: RNMediaStream | null;
  moderationBlur: boolean;
  onlineHint: number;
  resetMatchUi: () => void;
  setSocket: (s: Socket | null) => void;
  setConnected: (v: boolean) => void;
  setQueued: (v: boolean) => void;
  setQueuePosition: (n: number) => void;
  setMatched: (m: { matchId: string; isOfferer: boolean; peerUserId: string }) => void;
  setPeerLabel: (label: string) => void;
  setLocalWave: (v: boolean) => void;
  setRemoteWave: (v: boolean) => void;
  setIcebreaker: (text: string | null) => void;
  setRemoteStream: (stream: RNMediaStream | null) => void;
  setModerationBlur: (v: boolean) => void;
  setOnlineHint: (n: number) => void;
};

export const useMatchStore = create<MatchState>((set) => ({
  socket: null,
  connected: false,
  queued: false,
  queuePosition: 0,
  matchId: null,
  isOfferer: null,
  peerUserId: null,
  peerUserLabel: "Stranger",
  localWaveReady: false,
  remoteWaveReady: false,
  icebreaker: null,
  remoteStream: null,
  moderationBlur: false,
  onlineHint: 0,

  resetMatchUi: () =>
    set({
      matchId: null,
      isOfferer: null,
      peerUserId: null,
      localWaveReady: false,
      remoteWaveReady: false,
      icebreaker: null,
      remoteStream: null,
      moderationBlur: false,
      queued: false,
      queuePosition: 0,
    }),

  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ connected }),
  setQueued: (queued) => set({ queued }),
  setQueuePosition: (queuePosition) => set({ queuePosition }),
  setMatched: ({ matchId, isOfferer, peerUserId }) =>
    set({
      matchId,
      isOfferer,
      peerUserId,
      localWaveReady: false,
      remoteWaveReady: false,
      icebreaker: null,
      remoteStream: null,
      moderationBlur: false,
    }),
  setPeerLabel: (peerUserLabel) => set({ peerUserLabel }),
  setLocalWave: (localWaveReady) => set({ localWaveReady }),
  setRemoteWave: (remoteWaveReady) => set({ remoteWaveReady }),
  setIcebreaker: (icebreaker) => set({ icebreaker }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setModerationBlur: (moderationBlur) => set({ moderationBlur }),
  setOnlineHint: (onlineHint) => set({ onlineHint }),
}));
