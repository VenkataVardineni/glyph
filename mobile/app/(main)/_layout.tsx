import { Stack } from "expo-router";
import { useGlyphSocket } from "../../src/hooks/useGlyphSocket";
import { useSessionStore } from "../../src/stores/sessionStore";
import { colors } from "../../src/theme";

export default function MainLayout() {
  const userId = useSessionStore((s) => s.userId);
  useGlyphSocket(Boolean(userId));

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.void },
        animation: "fade",
      }}
    />
  );
}
