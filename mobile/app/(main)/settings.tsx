import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EULA_VERSION } from "../../src/legal/constants";
import { getEulaUrl, getPrivacyPolicyUrl } from "../../src/lib/legalUrls";
import { useSessionStore } from "../../src/stores/sessionStore";
import { colors } from "../../src/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const waveToUnblur = useSessionStore((s) => s.waveToUnblur);
  const translationEnabled = useSessionStore((s) => s.translationEnabled);
  const depth3d = useSessionStore((s) => s.depth3d);
  const brushPhysics = useSessionStore((s) => s.brushPhysics);
  const eulaAcceptedVersion = useSessionStore((s) => s.eulaAcceptedVersion);
  const blockedUserIds = useSessionStore((s) => s.blockedUserIds);
  const setWaveToUnblur = useSessionStore((s) => s.setWaveToUnblur);
  const setTranslationEnabled = useSessionStore((s) => s.setTranslationEnabled);
  const setDepth3d = useSessionStore((s) => s.setDepth3d);
  const setBrushPhysics = useSessionStore((s) => s.setBrushPhysics);

  const cyclePhysics = () => {
    const order = ["none", "gravity", "dissolve"] as const;
    const i = order.indexOf(brushPhysics);
    void setBrushPhysics(order[(i + 1) % order.length]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backTxt}>← Back</Text>
      </Pressable>
      <Text style={styles.title}>Trust & canvas</Text>
      <Text style={styles.sub}>
        Report and Block are on the live call screen (Guideline 1.2). Developer moderation console: open{" "}
        <Text style={styles.mono}>/admin/dashboard</Text> on your signal server with <Text style={styles.mono}>ADMIN_TOKEN</Text>.
      </Text>

      <View style={styles.legalCard}>
        <Text style={styles.cardTitle}>Legal & privacy</Text>
        <Pressable onPress={() => void Linking.openURL(getPrivacyPolicyUrl())}>
          <Text style={styles.link}>Privacy Policy (public URL)</Text>
        </Pressable>
        <Pressable onPress={() => void Linking.openURL(getEulaUrl())}>
          <Text style={styles.link}>Full EULA (public URL)</Text>
        </Pressable>
        <Text style={styles.meta}>
          Accepted EULA version on device: {eulaAcceptedVersion ?? "none"} (current {EULA_VERSION})
        </Text>
        <Text style={styles.meta}>
          Blocked accounts (never matched again): {blockedUserIds.length}
        </Text>
      </View>

      <Row
        label="Wave to unblur"
        hint="Both parties confirm presence before full video."
        value={waveToUnblur}
        onValueChange={(v) => void setWaveToUnblur(v)}
      />
      <Row
        label="Live translation captions"
        hint="Stub UI — wire streaming STT + MT."
        value={translationEnabled}
        onValueChange={(v) => void setTranslationEnabled(v)}
      />
      <Row
        label="Depth (3D strokes)"
        hint="Requires AR anchor pipeline (ARKit / ARCore)."
        value={depth3d}
        onValueChange={(v) => void setDepth3d(v)}
      />

      <Pressable style={styles.physics} onPress={() => cyclePhysics()}>
        <Text style={styles.physicsLabel}>Brush physics</Text>
        <Text style={styles.physicsVal}>{brushPhysics}</Text>
        <Text style={styles.physicsHint}>Gravity / dissolve are client-side stubs next.</Text>
      </Pressable>

      <Text style={styles.attNote}>
        App Tracking Transparency: the system prompt appears only if you set EXPO_PUBLIC_REQUEST_APPLE_TRACKING=1
        and ship a build that uses cross-app tracking. Otherwise Glyph does not request tracking.
      </Text>
    </View>
  );
}

function Row({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void, paddingHorizontal: 20, gap: 14 },
  back: { alignSelf: "flex-start", marginBottom: 8 },
  backTxt: { color: colors.accent, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  sub: { color: colors.muted, marginBottom: 8, lineHeight: 20 },
  mono: { fontFamily: "monospace", color: colors.accent2, fontSize: 12 },
  legalCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  cardTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
  link: { color: colors.accent2, fontWeight: "600" },
  meta: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: { color: colors.text, fontSize: 16, fontWeight: "600" },
  rowHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  physics: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  physicsLabel: { color: colors.muted, fontSize: 12, textTransform: "uppercase" },
  physicsVal: { color: colors.text, fontSize: 20, fontWeight: "700", textTransform: "capitalize" },
  physicsHint: { color: colors.muted, fontSize: 12 },
  attNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8, marginBottom: 24 },
});
