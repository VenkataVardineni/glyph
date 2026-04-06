import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMatchStore } from "../../src/stores/matchStore";
import { useSessionStore } from "../../src/stores/sessionStore";
import { colors } from "../../src/theme";

export default function LobbyScreen() {
  const insets = useSafeAreaInsets();
  const [perm, request] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(true);
  const [camMountError, setCamMountError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const isSimulator = !Constants.isDevice;
  const connected = useMatchStore((s) => s.connected);
  const matchId = useMatchStore((s) => s.matchId);
  const queuePosition = useMatchStore((s) => s.queuePosition);
  const queued = useMatchStore((s) => s.queued);
  const onlineHint = useMatchStore((s) => s.onlineHint);
  const socket = useMatchStore((s) => s.socket);
  const setQueued = useMatchStore((s) => s.setQueued);

  const tags = useSessionStore((s) => s.tags);
  const language = useSessionStore((s) => s.language);
  const drawingOnly = useSessionStore((s) => s.drawingOnly);
  const setTags = useSessionStore((s) => s.setTags);
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const setDrawingOnly = useSessionStore((s) => s.setDrawingOnly);
  const blockedUserIds = useSessionStore((s) => s.blockedUserIds);

  useFocusEffect(
    useCallback(() => {
      setCameraActive(true);
      setCamMountError(null);
      void request();
      return () => setCameraActive(false);
    }, [request])
  );

  useEffect(() => {
    if (matchId) router.push("/(main)/canvas");
  }, [matchId]);

  const applyTags = () => {
    const parts = tagInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    void setTags(parts);
  };

  const connect = () => {
    if (!socket) return;
    applyTags();
    setQueued(true);
    socket.emit("join_queue", {
      tags: tags.length
        ? tags
        : tagInput
            .split(/[\s,]+/)
            .map((t) => t.replace(/^#/, "").trim())
            .filter(Boolean)
            .slice(0, 3),
      language,
      drawingOnly,
      userId: useSessionStore.getState().userId ?? "anon",
      excludeUserIds: blockedUserIds,
    });
  };

  const cancel = () => {
    socket?.emit("leave_queue");
    setQueued(false);
  };

  const permBlocked = perm && !perm.granted && !perm.canAskAgain;

  return (
    <View style={styles.root}>
      {/* Native preview + no BlurView above it (iOS can fail to composite camera under UIVisualEffectView). */}
      <View style={StyleSheet.absoluteFill} collapsable={false}>
        {perm?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="front"
            mirror
            mode="video"
            active={cameraActive}
            onMountError={(e) => setCamMountError(e.message)}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Allow camera access"
            style={[StyleSheet.absoluteFill, styles.noCam]}
            onPress={() => void request()}
          >
            <Text style={styles.noCamHint}>
              {permBlocked
                ? "Camera access is off for Glyph. Open Settings to turn it on."
                : "Tap to allow camera — you’ll see your preview behind the lobby."}
            </Text>
            {permBlocked ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open system settings"
                style={styles.settingsBtn}
                onPress={() => void Linking.openSettings()}
              >
                <Text style={styles.settingsBtnText}>Open Settings</Text>
              </Pressable>
            ) : null}
          </Pressable>
        )}
      </View>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(5,5,8,0.28)", "rgba(5,5,8,0.78)"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open glyphs gallery"
          onPress={() => router.push("/(main)/glyphs")}
          style={styles.iconBtn}
        >
          <Text style={styles.iconTxt}>◇</Text>
        </Pressable>
        <View style={styles.onlinePill}>
          <Text style={styles.onlineTxt}>
            {connected ? `Live · ${onlineHint || "—"} sockets` : "Connecting…"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.push("/(main)/settings")}
          style={styles.iconBtn}
        >
          <Text style={styles.iconTxt}>⚙</Text>
        </Pressable>
      </View>

      {isSimulator || camMountError ? (
        <View style={styles.camBanner}>
          {isSimulator ? (
            <Text style={styles.simHint}>
              Simulator: no real camera — use a physical iPhone, or Simulator → I/O → Camera.
            </Text>
          ) : null}
          {camMountError ? <Text style={styles.camErr}>{camMountError}</Text> : null}
        </View>
      ) : null}

      <View style={styles.center}>
        <Text style={styles.wordmark}>Glyph</Text>
        <Text style={styles.sub}>Enter the void</Text>
        {queued ? (
          <View style={styles.queueCard}>
            <Text style={styles.queueTitle}>Matching</Text>
            <Text style={styles.queueBody}>
              Queue #{queuePosition || 1} · bias: {language} · {drawingOnly ? "drawing" : "full"} cam
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel matchmaking"
              style={styles.secondary}
              onPress={cancel}
            >
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Connect and join matchmaking queue"
            style={styles.voidBtn}
            onPress={connect}
          >
            <LinearGradient colors={["#7c3aed", "#22d3ee"]} style={styles.voidGrad}>
              <Text style={styles.voidTxt}>Connect</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.filterLabel}>Match tags (max 3)</Text>
        <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          placeholder="#art #chill"
          placeholderTextColor={colors.muted}
          style={styles.input}
          onSubmitEditing={applyTags}
        />
        <View style={styles.row}>
          <FilterChip
            label={language === "any" ? "Language: any" : `Lang: ${language}`}
            onPress={() => void setLanguage(language === "any" ? "en" : language === "en" ? "es" : "any")}
          />
          <FilterChip
            label={drawingOnly ? "Drawing cam" : "Full cam"}
            onPress={() => void setDrawingOnly(!drawingOnly)}
          />
        </View>
      </View>
    </View>
  );
}

function FilterChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.chip} onPress={onPress}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void },
  noCam: { backgroundColor: "#111", justifyContent: "center", padding: 24 },
  noCamHint: { color: colors.muted, textAlign: "center", fontSize: 15, lineHeight: 22 },
  settingsBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  settingsBtnText: { color: colors.accent, fontWeight: "700" },
  camBanner: { paddingHorizontal: 16, paddingBottom: 6, gap: 4 },
  simHint: { color: colors.muted, fontSize: 11, lineHeight: 15, textAlign: "center" },
  camErr: { color: colors.danger, fontSize: 11, textAlign: "center" },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconTxt: { color: colors.text, fontSize: 18 },
  onlinePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: colors.line,
  },
  onlineTxt: { color: colors.muted, fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  wordmark: { fontSize: 42, fontWeight: "900", color: colors.text, letterSpacing: -1 },
  sub: { color: colors.muted, marginBottom: 12 },
  voidBtn: { borderRadius: 999, overflow: "hidden", marginTop: 8 },
  voidGrad: { paddingHorizontal: 52, paddingVertical: 18 },
  voidTxt: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  queueCard: {
    marginTop: 12,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    gap: 8,
    minWidth: 260,
  },
  queueTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  queueBody: { color: colors.muted, textAlign: "center" },
  secondary: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryText: { color: colors.text, fontWeight: "600" },
  bottom: { paddingHorizontal: 20, gap: 10 },
  filterLabel: { color: colors.muted, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.line,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: { color: colors.text, fontSize: 13 },
});
