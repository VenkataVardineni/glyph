import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { onboardingStep, useSessionStore } from "../src/stores/sessionStore";
import { colors } from "../src/theme";

export default function Index() {
  const hydrate = useSessionStore((s) => s.hydrate);
  const hydrated = useSessionStore((s) => s.hydrated);
  const onboarded = useSessionStore((s) => s.onboarded);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (onboarded) {
    return <Redirect href="/(main)/lobby" />;
  }

  const step = onboardingStep();
  if (step === "sign-in") return <Redirect href="/onboarding/sign-in" />;
  if (step === "safety") return <Redirect href="/onboarding/safety" />;
  if (step === "eula") return <Redirect href="/onboarding/eula" />;
  if (step === "tutorial") return <Redirect href="/onboarding/tutorial" />;

  return <Redirect href="/(main)/lobby" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.void, alignItems: "center", justifyContent: "center" },
});
