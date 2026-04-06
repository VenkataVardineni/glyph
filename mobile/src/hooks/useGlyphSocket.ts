import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { SocketEvents } from "../constants/socketEvents";
import { getServerUrl } from "../lib/config";
import { fetchOnlineCount } from "../lib/pollServerStats";
import { useDrawingStore } from "../stores/drawingStore";
import { useMatchStore } from "../stores/matchStore";
import { useSessionStore } from "../stores/sessionStore";

export function useGlyphSocket(enabled: boolean) {
  const userId = useSessionStore((s) => s.userId);
  const setSocket = useMatchStore((s) => s.setSocket);
  const resetMatchUi = useMatchStore((s) => s.resetMatchUi);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;

    const url = getServerUrl();
    const socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 14,
      reconnectionDelay: 800,
      reconnectionDelayMax: 20000,
      timeout: 20000,
    });
    socketRef.current = socket;
    setSocket(socket);

    const kickBanned = () => {
      resetMatchUi();
      useDrawingStore.getState().clearAll();
      void useSessionStore.getState().accountTerminated();
    };

    socket.on("connect", () => {
      useMatchStore.getState().setConnected(true);
      socket.emit(
        SocketEvents.authenticate,
        { userId },
        (r?: { ok?: boolean; code?: string }) => {
          if (r?.ok === false && r?.code === "BANNED") kickBanned();
        }
      );
    });

    socket.on("disconnect", () => {
      useMatchStore.getState().setConnected(false);
    });

    socket.on(SocketEvents.authenticated, () => undefined);

    socket.on(SocketEvents.authError, (msg: { code?: string }) => {
      if (msg?.code === "BANNED") kickBanned();
    });

    socket.on(SocketEvents.queueStatus, (msg: { position: number }) => {
      useMatchStore.getState().setQueuePosition(msg.position);
    });

    socket.on(
      SocketEvents.matched,
      (msg: {
        matchId: string;
        isOfferer: boolean;
        peerUserId?: string;
        prefs?: { tags?: string[] };
      }) => {
        useMatchStore.getState().setMatched({
          matchId: msg.matchId,
          isOfferer: msg.isOfferer,
          peerUserId: msg.peerUserId ?? "",
        });
        const tags = msg.prefs?.tags?.length ? msg.prefs.tags.join(", ") : "open vibe";
        useMatchStore.getState().setPeerLabel(tags);
      }
    );

    socket.on(SocketEvents.peerWave, (msg: { ready: boolean }) => {
      useMatchStore.getState().setRemoteWave(msg.ready);
    });

    socket.on(SocketEvents.icebreaker, (msg: { text: string }) => {
      useMatchStore.getState().setIcebreaker(msg.text);
    });

    socket.on(
      SocketEvents.stroke,
      (msg: {
        matchId: string;
        strokeId: string;
        points: { x: number; y: number }[];
        color: string;
        width: number;
        brush: string;
      }) => {
        useDrawingStore.getState().addRemoteStroke({
          id: msg.strokeId,
          points: msg.points,
          color: msg.color,
          width: msg.width,
          brush: msg.brush,
        });
      }
    );

    socket.on(SocketEvents.peerDisconnected, () => {
      useMatchStore.getState().resetMatchUi();
      useDrawingStore.getState().clearAll();
    });

    socket.on(SocketEvents.moderationViolation, () => {
      useMatchStore.getState().setModerationBlur(true);
    });

    socket.on(SocketEvents.blockedOk, (msg: { peerUserId: string }) => {
      void useSessionStore.getState().addBlockedUserId(msg.peerUserId);
    });

    const poll = setInterval(() => void fetchOnlineCount(), 15000);
    void fetchOnlineCount();

    return () => {
      clearInterval(poll);
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
      useMatchStore.getState().setConnected(false);
      resetMatchUi();
    };
  }, [enabled, userId, setSocket, resetMatchUi]);
}
