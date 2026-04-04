/** @type {import('expo/config').ExpoConfig} */
const requestAppleTracking = process.env.EXPO_PUBLIC_REQUEST_APPLE_TRACKING === "1";

module.exports = {
  expo: {
    name: "Glyph",
    slug: "glyph",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "glyph",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#050508",
    },
    plugins: [
      "expo-router",
      "expo-tracking-transparency",
      [
        "expo-camera",
        {
          cameraPermission:
            "Glyph uses the camera to track your hand gestures for AR drawing and to share your video with your match.",
          microphonePermission: "Glyph uses the microphone so you can talk to your match.",
        },
      ],
    ],
    extra: {
      serverUrl: process.env.EXPO_PUBLIC_SERVER_URL || "http://127.0.0.1:3001",
      privacyPolicyUrl:
        process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || "https://example.com/glyph/privacy-policy",
      eulaUrl: process.env.EXPO_PUBLIC_EULA_URL || "https://example.com/glyph/eula",
      /** Set EXPO_PUBLIC_REQUEST_APPLE_TRACKING=1 only if you use cross-app tracking / IDFA analytics. */
      requestAppleTracking,
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.glyph.app",
      infoPlist: {
        NSCameraUsageDescription:
          "Glyph uses the camera to track your hand gestures for AR drawing and to share your video with your match.",
        NSMicrophoneUsageDescription: "Glyph uses the microphone so you can talk to your match.",
        ...(requestAppleTracking && {
          NSUserTrackingUsageDescription:
            "Glyph uses this permission only if you opt in to analytics that track you across apps or websites owned by other companies, to improve safety and product quality.",
        }),
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#050508",
      },
      package: "com.glyph.app",
      permissions: ["CAMERA", "RECORD_AUDIO", "INTERNET", "ACCESS_NETWORK_STATE"],
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
  },
};
