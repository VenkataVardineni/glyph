import { Stack } from "expo-router";
import { colors } from "../../src/theme";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.void },
        animation: "slide_from_right",
      }}
    />
  );
}
