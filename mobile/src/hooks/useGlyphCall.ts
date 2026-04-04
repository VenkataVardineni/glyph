import { useEffect, useState } from "react";
import type { MediaStream as RNMediaStream } from "react-native-webrtc";
import { getRTC, ICE_SERVERS } from "../lib/webrtc";
import { useMatchStore } from "../stores/matchStore";

type SignalMsg = {
  matchId: string;
  type: "offer" | "answer" | "candidate";
  sdp?: string;
  candidate?: unknown;
  from?: string;
};

/**
 * WebRTC offer/answer + ICE. Requires `npx expo prebuild` + dev client (not Expo Go).
 */
export function useGlyphCall(active: boolean) {
  const socket = useMatchStore((s) => s.socket);
  const matchId = useMatchStore((s) => s.matchId);
  const isOfferer = useMatchStore((s) => s.isOfferer);
  const setRemoteStream = useMatchStore((s) => s.setRemoteStream);
  const [localStream, setLocalStream] = useState<RNMediaStream | null>(null);

  useEffect(() => {
    if (!active || !socket || !matchId || isOfferer === null) {
      setLocalStream(null);
      return;
    }

    const RTC = getRTC();
    if (!RTC) {
      setRemoteStream(null);
      setLocalStream(null);
      return;
    }

    const { RTCPeerConnection, mediaDevices, RTCSessionDescription, RTCIceCandidate, MediaStream } =
      RTC;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS }) as unknown as {
      ontrack: ((ev: { streams?: RNMediaStream[]; track?: unknown }) => void) | null;
      onicecandidate: ((ev: { candidate: { toJSON?: () => object } | null }) => void) | null;
      addTrack: (track: unknown, stream: RNMediaStream) => void;
      addIceCandidate: (c: InstanceType<typeof RTCIceCandidate>) => Promise<void>;
      setRemoteDescription: (d: InstanceType<typeof RTCSessionDescription>) => Promise<void>;
      setLocalDescription: (d: InstanceType<typeof RTCSessionDescription>) => Promise<void>;
      createAnswer: () => Promise<InstanceType<typeof RTCSessionDescription>>;
      createOffer: (o?: object) => Promise<InstanceType<typeof RTCSessionDescription>>;
      close: () => void;
    };

    let local: RNMediaStream | null = null;
    const remote = new MediaStream();

    pc.ontrack = (ev) => {
      if (ev.streams?.[0]) {
        ev.streams[0].getTracks().forEach((t) => remote.addTrack(t));
      } else if (ev.track) {
        remote.addTrack(ev.track as never);
      }
      setRemoteStream(remote);
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && matchId) {
        socket.emit("signal", {
          matchId,
          type: "candidate",
          candidate: ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate,
        });
      }
    };

    const onSignal = async (msg: SignalMsg) => {
      if (!msg || msg.matchId !== matchId) return;
      try {
        if (msg.type === "offer" && msg.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: msg.sdp }));
          local = await mediaDevices.getUserMedia({
            audio: true,
            video: {
              facingMode: "user",
              width: { ideal: 720 },
              height: { ideal: 1280 },
            },
          });
          local.getTracks().forEach((t) => pc.addTrack(t, local!));
          setLocalStream(local);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { matchId, type: "answer", sdp: answer.sdp });
        } else if (msg.type === "answer" && msg.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: msg.sdp }));
        } else if (msg.type === "candidate" && msg.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate as object));
          } catch {
            /* ignore stale */
          }
        }
      } catch (e) {
        console.warn("glyph webrtc signal error", e);
      }
    };

    socket.on("signal", onSignal);

    const runOfferer = async () => {
      try {
        local = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: "user",
            width: { ideal: 720 },
            height: { ideal: 1280 },
          },
        });
        local.getTracks().forEach((t) => pc.addTrack(t, local!));
        setLocalStream(local);
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        socket.emit("signal", { matchId, type: "offer", sdp: offer.sdp });
      } catch (e) {
        console.warn("glyph webrtc offer error", e);
      }
    };

    if (isOfferer) void runOfferer();

    return () => {
      socket.off("signal", onSignal);
      local?.getTracks().forEach((t) => t.stop());
      remote.getTracks().forEach((t) => t.stop());
      pc.close();
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [active, socket, matchId, isOfferer, setRemoteStream]);

  return { localStream };
}
