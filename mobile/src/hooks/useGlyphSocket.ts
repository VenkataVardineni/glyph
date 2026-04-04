import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getServerUrl } from "../lib/config";
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
        "authenticate",
        { userId },
        (r?: { ok?: boolean; code?: string }) => {
          if (r?.ok === false && r?.code === "BANNED") kickBanned();
        }
      );
    });

    socket.on("disconnect", () => {
      useMatchStore.getState().setConnected(false);
    });

    socket.on("authenticated", () => undefined);

    socket.on("auth_error", (msg: { code?: string }) => {
      if (msg?.code === "BANNED") kickBanned();
    });

    socket.on("queue_status", (msg: { position: number }) => {
      useMatchStore.getState().setQueuePosition(msg.position);
    });

    socket.on(
      "matched",
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

    socket.on("peer_wave", (msg: { ready: boolean }) => {
      useMatchStore.getState().setRemoteWave(msg.ready);
    });

    socket.on("icebreaker", (msg: { text: string }) => {
      useMatchStore.getState().setIcebreaker(msg.text);
    });

    socket.on(
      "stroke",
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

    socket.on("peer_disconnected", () => {
      useMatchStore.getState().resetMatchUi();
      useDrawingStore.getState().clearAll();
    });

    socket.on("moderation_violation", () => {
      useMatchStore.getState().setModerationBlur(true);
    });

    socket.on("blocked_ok", (msg: { peerUserId: string }) => {
      void useSessionStore.getState().addBlockedUserId(msg.peerUserId);
    });

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`${url}/stats`);
        const j = (await res.json()) as { online?: number };
        if (typeof j.online === "number") useMatchStore.getState().setOnlineHint(j.online);
      } catch {
        /* ignore */
      }
    }, 15000);
    void (async () => {
      try {
        const res = await fetch(`${url}/stats`);
        const j = (await res.json()) as { online?: number };
        if (typeof j.online === "number") useMatchStore.getState().setOnlineHint(j.online);
      } catch {
        /* ignore */
      }
    })();

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
