import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { EULA_VERSION } from "../../src/legal/constants";
import { getEulaUrl } from "../../src/lib/legalUrls";
import { useSessionStore } from "../../src/stores/sessionStore";
import { colors } from "../../src/theme";

const ZERO_TOLERANCE = [
  "Zero tolerance for objectionable content or abusive users. Glyph may suspend or terminate access immediately for: sexual or exploitative content involving minors; non-consensual intimate imagery; illegal activity; credible threats; hate speech directed at protected groups; harassment or bullying intended to harm.",
  "You grant us the right to enforce these rules through automated systems (computer vision on video samples, audio transcription and NLP classifiers) and human review of reports. Violations may result in blur, disconnect, device/account restrictions, and reports to authorities where required by law.",
  "You will not circumvent safety controls. You will not stream third-party content intended to shock, harm, or sexualize non-consenting parties.",
];

export default function EulaScreen() {
  const acceptEula = useSessionStore((s) => s.acceptEula);
  const [read, setRead] = useState(false);
  const [agree, setAgree] = useState(false);

  const next = async () => {
    if (!read || !agree) return;
    await acceptEula();
    router.replace("/onboarding/tutorial");
  };

  return (
    <LinearGradient colors={["#0b0b10", colors.void]} style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>End User License Agreement</Text>
        <Text style={styles.version}>Version {EULA_VERSION} · Required for App Store guideline 1.2</Text>
        <Text style={styles.body}>
          By using Glyph you enter a binding agreement with the developer. This summary highlights zero-tolerance
          and safety terms. The full legal text should be hosted at your public URL (see link below) and supplied
          in App Store Connect as your custom EULA if applicable.
        </Text>
        {ZERO_TOLERANCE.map((p) => (
          <View key={p.slice(0, 40)} style={styles.para}>
            <Text style={styles.paraText}>{p}</Text>
          </View>
        ))}
        <Pressable onPress={() => void Linking.openURL(getEulaUrl())}>
          <Text style={styles.link}>Open full EULA (hosted URL)</Text>
        </Pressable>
        <Pressable style={styles.checkRow} onPress={() => setRead((v) => !v)}>
          <View style={[styles.box, read && styles.boxOn]} />
          <Text style={styles.checkLabel}>I have read the EULA and zero-tolerance policy above.</Text>
        </Pressable>
        <Pressable style={styles.checkRow} onPress={() => setAgree((v) => !v)}>
          <View style={[styles.box, agree && styles.boxOn]} />
          <Text style={styles.checkLabel}>I agree to be bound by this EULA and community rules.</Text>
        </Pressable>
        <Pressable style={[styles.primary, (!read || !agree) && styles.disabled]} onPress={() => void next()}>
          <Text style={styles.primaryText}>Accept & continue</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingTop: 56, gap: 14, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  version: { color: colors.muted, fontSize: 13 },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  para: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(244,63,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.25)",
  },
  paraText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  link: { color: colors.accent2, fontWeight: "600", marginTop: 4 },
  checkRow: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 },
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
