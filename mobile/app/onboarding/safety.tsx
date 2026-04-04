import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSessionStore } from "../../src/stores/sessionStore";
import { colors } from "../../src/theme";

const RULES = [
  "No nudity, sexual content, or exploitation. Computer vision runs continuously; violations blur, disconnect, and flag.",
  "No hate, harassment, or threats. Audio is transcribed in short windows for classifier checks.",
  "No illegal activity, doxxing, or minors on camera. Report anything unsafe with one tap.",
  "Mutual consent: “Wave to unblur” requires both sides to signal presence before full video.",
];

export default function SafetyScreen() {
  const acceptSafety = useSessionStore((s) => s.acceptSafety);
  const [checked, setChecked] = useState(false);

  const next = async () => {
    if (!checked) return;
    await acceptSafety();
    router.replace("/onboarding/eula");
  };

  return (
    <LinearGradient colors={["#0b0b10", colors.void]} style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Community safety</Text>
        <Text style={styles.sub}>Unskippable. This is how Glyph stays reviewable.</Text>
        {RULES.map((r) => (
          <View key={r.slice(0, 24)} style={styles.rule}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.ruleText}>{r}</Text>
          </View>
        ))}
        <Pressable style={styles.checkRow} onPress={() => setChecked((c) => !c)}>
          <View style={[styles.box, checked && styles.boxOn]} />
          <Text style={styles.checkLabel}>I understand and will follow these rules.</Text>
        </Pressable>
        <Pressable style={[styles.primary, !checked && styles.disabled]} onPress={() => void next()}>
          <Text style={styles.primaryText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingTop: 56, gap: 14, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  sub: { color: colors.muted, fontSize: 15, marginBottom: 8 },
  rule: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bullet: { color: colors.accent2, fontSize: 18, lineHeight: 22 },
  ruleText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
  checkRow: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 12 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.line,
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkLabel: { flex: 1, color: colors.muted, fontSize: 14 },
  primary: {
    marginTop: 16,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  disabled: { opacity: 0.35 },
  primaryText: { color: "#0b0b10", fontSize: 16, fontWeight: "700" },
});
