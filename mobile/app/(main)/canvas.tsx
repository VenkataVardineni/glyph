import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ARPalette } from "../../src/components/ARPalette";
import { DrawingLayer } from "../../src/components/DrawingLayer";
import { VideoPane } from "../../src/components/VideoPane";
import { useGlyphCall } from "../../src/hooks/useGlyphCall";
import { useDrawingStore } from "../../src/stores/drawingStore";
import { useGlyphsStore } from "../../src/stores/glyphsStore";
import { useMatchStore } from "../../src/stores/matchStore";
import { useSessionStore } from "../../src/stores/sessionStore";
import { colors } from "../../src/theme";

export default function CanvasScreen() {
  const insets = useSafeAreaInsets();
  const matchId = useMatchStore((s) => s.matchId);
  const socket = useMatchStore((s) => s.socket);
  const icebreaker = useMatchStore((s) => s.icebreaker);
  const moderationBlur = useMatchStore((s) => s.moderationBlur);
  const setModerationBlur = useMatchStore((s) => s.setModerationBlur);
  const resetMatchUi = useMatchStore((s) => s.resetMatchUi);
  const setLocalWave = useMatchStore((s) => s.setLocalWave);
  const setRemoteWave = useMatchStore((s) => s.setRemoteWave);
  const localWave = useMatchStore((s) => s.localWaveReady);
  const remoteWave = useMatchStore((s) => s.remoteWaveReady);
  const remoteStream = useMatchStore((s) => s.remoteStream);
  const waveToUnblur = useSessionStore((s) => s.waveToUnblur);
  const drawingOnly = useSessionStore((s) => s.drawingOnly);
  const translationEnabled = useSessionStore((s) => s.translationEnabled);
  const peerUserId = useMatchStore((s) => s.peerUserId);
  const addBlockedUserId = useSessionStore((s) => s.addBlockedUserId);

  const clearAll = useDrawingStore((s) => s.clearAll);
  const consentSave = useGlyphsStore((s) => s.consentSave);

  const { localStream } = useGlyphCall(Boolean(matchId));
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const swipeRef = useRef({ x: 0 });

  useEffect(() => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }, [muted, localStream]);

  useEffect(() => {
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !camOff;
    });
  }, [camOff, localStream]);

  useEffect(() => {
    if (!matchId) {
      router.replace("/(main)/lobby");
    }
  }, [matchId]);

  useEffect(() => {
    return () => {
      socket?.emit("disconnect_match");
      resetMatchUi();
      clearAll();
    };
  }, [socket, resetMatchUi, clearAll]);

  useEffect(() => {
    if (!matchId || !socket) return;
    const id = setInterval(() => {
      socket.emit(
        "moderation_frame",
        { frameId: String(Date.now()) },
        (r?: { safe: boolean; action: string }) => {
          if (r?.action === "blur") setModerationBlur(true);
          if (r?.action === "disconnect") {
            Alert.alert("Session ended", "Safety policy triggered.");
            leave();
          }
        }
      );
    }, 5000);
    return () => clearInterval(id);
  }, [matchId, socket, setModerationBlur]);

  useEffect(() => {
    if (!matchId || !socket) return;
    const id = setInterval(() => {
      socket.emit(
        "moderation_audio",
        { text: "" },
        (r?: { safe: boolean; warn: boolean }) => {
          if (r?.warn) {
            Alert.alert("Audio safety", "Potentially unsafe speech detected. Adjust your language or leave the call.");
          }
        }
      );
    }, 12000);
    return () => clearInterval(id);
  }, [matchId, socket]);

  const leave = () => {
    socket?.emit("disconnect_match");
    resetMatchUi();
    clearAll();
    router.replace("/(main)/lobby");
  };

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12,
      onPanResponderMove: (_, g) => {
        swipeRef.current.x = g.dx;
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -90) leave();
      },
    })
  ).current;

  const blurVideos = waveToUnblur ? !(localWave && remoteWave) : false;
  const visualBlur = blurVideos || moderationBlur;

  return (
    <View style={styles.root} {...swipe.panHandlers}>
      <View style={[styles.safetyRibbon, { top: insets.top + 6 }]}>
        <Text style={styles.safetyRibbonText}>
          Safety: Report & Block below · Real-time video CV + audio NLP (wire production models)
        </Text>
      </View>
      <View style={styles.split}>
        <VideoPane
          stream={localStream}
          mirror
          blur={visualBlur}
          drawingOnlyFaceBlur={drawingOnly}
        />
        <VideoPane
          stream={remoteStream}
          blur={visualBlur}
          drawingOnlyFaceBlur={drawingOnly}
        />
      </View>

      <DrawingLayer enabled />

      {icebreaker && (
        <View style={styles.ice}>
          <Text style={styles.iceTitle}>Prompt</Text>
          <Text style={styles.iceText}>{icebreaker}</Text>
        </View>
      )}

      {translationEnabled && (
        <View style={styles.captions}>
          <Text style={styles.capText}>Live translation: stub (wire STT + MT)</Text>
        </View>
      )}

      <ARPalette />

      {waveToUnblur && (
        <View style={[styles.waveBar, { top: insets.top + 44 }]}>
          <Text style={styles.waveTxt}>
            {localWave ? "You waved" : "Wave to unblur"} · {remoteWave ? "Peer waved" : "Waiting peer"}
          </Text>
          <Pressable
            style={styles.waveBtn}
            onPress={() => {
              setLocalWave(true);
              if (matchId) socket?.emit("wave_ready", { matchId, ready: true });
            }}
          >
            <Text style={styles.waveBtnTxt}>Confirm wave</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.toolbar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={styles.tool} onPress={() => setMuted((m) => !m)}>
          <Text style={styles.toolTxt}>{muted ? "Unmute" : "Mute"}</Text>
        </Pressable>
        <Pressable style={styles.tool} onPress={() => setCamOff((c) => !c)}>
          <Text style={styles.toolTxt}>{camOff ? "Cam on" : "Cam off"}</Text>
        </Pressable>
        <Pressable
          style={styles.tool}
          onPress={() => {
            if (matchId) socket?.emit("icebreaker_request", { matchId });
          }}
        >
          <Text style={styles.toolTxt}>Icebreaker</Text>
        </Pressable>
        <Pressable
          style={[styles.tool, styles.danger]}
          onPress={() => {
            Alert.alert("Report", "Flag this session for human review (24h triage)?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Report",
                style: "destructive",
                onPress: () => {
                  socket?.emit("report", {
                    matchId,
                    reason: "user_report",
                    reportedUserId: peerUserId ?? undefined,
                  });
                  leave();
                },
              },
            ]);
          }}
        >
          <Text style={styles.toolTxt}>Report</Text>
        </Pressable>
        <Pressable
          style={[styles.tool, styles.danger]}
          onPress={() => {
            if (!peerUserId || !matchId) {
              Alert.alert("Block", "No peer linked yet.");
              return;
            }
            Alert.alert(
              "Block user",
              "They will not be matched with you again on this service.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Block",
                  style: "destructive",
                  onPress: () => {
                    socket?.emit("block_user", { matchId, peerUserId });
                    void addBlockedUserId(peerUserId);
                    leave();
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.toolTxt}>Block</Text>
        </Pressable>
        <Pressable
          style={styles.tool}
          onPress={() => {
            Alert.alert(
              "Save glyph",
              "Production: both peers must consent. Dev flow saves metadata only.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Save",
                  onPress: () => void consentSave("Collaborative session", "Consent stub"),
                },
              ]
            );
          }}
        >
          <Text style={styles.toolTxt}>Save</Text>
        </Pressable>
      </View>

      <Text style={[styles.hint, { top: insets.top + 56 }]}>Swipe left to skip</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void },
  safetyRibbon: {
    position: "absolute",
    left: 8,
    right: 8,
    zIndex: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  safetyRibbonText: { color: colors.accent2, fontSize: 10, textAlign: "center", fontWeight: "600" },
  split: { flex: 1, flexDirection: "row" },
  ice: {
    position: "absolute",
    left: 16,
    right: 100,
    top: "12%",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: colors.line,
  },
  iceTitle: { color: colors.muted, fontSize: 11, textTransform: "uppercase", marginBottom: 4 },
  iceText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  captions: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: "18%",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  capText: { color: colors.muted, fontSize: 12 },
  waveBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  waveTxt: { flex: 1, color: colors.text, fontSize: 12 },
  waveBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.accent },
  waveBtnTxt: { color: "#0b0b10", fontWeight: "700", fontSize: 12 },
  toolbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "rgba(5,5,8,0.85)",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    justifyContent: "center",
  },
  tool: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  danger: { backgroundColor: "rgba(244,63,94,0.2)" },
  toolTxt: { color: colors.text, fontSize: 12, fontWeight: "600" },
  hint: {
    position: "absolute",
    alignSelf: "center",
    color: colors.muted,
    fontSize: 11,
  },
});
