import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { getServerUrl } from "../../src/lib/config";
import { getPrivacyPolicyUrl } from "../../src/lib/legalUrls";
import { useSessionStore } from "../../src/stores/sessionStore";
import { colors } from "../../src/theme";

export default function SignInScreen() {
  const setUserId = useSessionStore((s) => s.setUserId);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [ru, setRu] = useState("");
  const [rp, setRp] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const continueAnon = async () => {
    const id =
      globalThis.crypto?.randomUUID?.() ??
      `glyph_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await setUserId(id);
    router.replace("/onboarding/safety");
  };

  const reviewLogin = async () => {
    setErr(null);
    setBusy(true);
    try {
      const base = getServerUrl();
      const res = await fetch(`${base}/auth/review-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: ru.trim(), password: rp }),
      });
      const j = (await res.json()) as { ok?: boolean; userId?: string; message?: string };
      if (!res.ok || !j.ok || !j.userId) {
        setErr(j.message ?? "Review login failed. Configure server env (see legal/DEMO_ACCOUNT_FOR_APPLE.txt).");
        return;
      }
      await setUserId(j.userId);
      router.replace("/onboarding/safety");
    } catch {
      setErr("Network error — check EXPO_PUBLIC_SERVER_URL and that the signal server is running.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={["#0b0b10", colors.void]} style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.logo}>Glyph</Text>
        <Text style={styles.tag}>Spatial video · shared void</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Accountability</Text>
        <Text style={styles.body}>
          Production builds should use Sign in with Apple / Google. This flow issues a stable ID for matchmaking
          and safety (report/block/ban). You must host the Privacy Policy at a public URL and enter Apple’s demo
          credentials in App Store Connect.
        </Text>
        <Pressable onPress={() => void Linking.openURL(getPrivacyPolicyUrl())}>
          <Text style={styles.link}>Privacy Policy (hosted URL)</Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={() => void continueAnon()}>
          <Text style={styles.primaryText}>Continue</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => setReviewOpen((o) => !o)}>
          <Text style={styles.secondaryText}>
            {reviewOpen ? "Hide App Review sign-in" : "App Review sign-in (demo credentials)"}
          </Text>
        </Pressable>
        {reviewOpen && (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewHint}>Use credentials from your server env (REVIEW_DEMO_*).</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={ru}
              onChangeText={setRu}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={rp}
              onChangeText={setRp}
            />
            {err ? <Text style={styles.err}>{err}</Text> : null}
            <Pressable
              style={[styles.primary, busy && styles.disabled]}
              disabled={busy}
              onPress={() => void reviewLogin()}
            >
              {busy ? (
                <ActivityIndicator color="#0b0b10" />
              ) : (
                <Text style={styles.primaryText}>Sign in for review</Text>
              )}
            </Pressable>
          </View>
        )}
        <Text style={styles.footnote}>
          By continuing you accept the EULA (next step), community rules, and real-time safety scanning.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: "center" },
  header: { marginBottom: 32, gap: 8 },
  logo: { fontSize: 44, fontWeight: "800", color: colors.text, letterSpacing: -1 },
  tag: { color: colors.muted, fontSize: 16 },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "700" },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  link: { color: colors.accent2, fontWeight: "600", marginTop: 4 },
  primary: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#0b0b10", fontSize: 16, fontWeight: "700" },
  secondary: { paddingVertical: 10, alignItems: "center" },
  secondaryText: { color: colors.accent, fontWeight: "600", fontSize: 14 },
  reviewBox: { gap: 10, marginTop: 4 },
  reviewHint: { color: colors.muted, fontSize: 12 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.line,
  },
  err: { color: colors.danger, fontSize: 13 },
  disabled: { opacity: 0.6 },
  footnote: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
