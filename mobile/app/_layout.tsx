import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as TrackingTransparency from "expo-tracking-transparency";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { shouldRequestAppleTracking } from "../src/lib/legalUrls";
import { colors } from "../src/theme";

export default function RootLayout() {
  useEffect(() => {
    if (!shouldRequestAppleTracking()) return;
    void (async () => {
      await TrackingTransparency.requestTrackingPermissionsAsync();
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.void }}>
      <ErrorBoundary>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.void },
            animation: "fade",
          }}
        />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
