import Constants from "expo-constants";

export function getPrivacyPolicyUrl(): string {
  return (
    (Constants.expoConfig?.extra?.privacyPolicyUrl as string) ||
    "https://example.com/glyph/privacy-policy"
  );
}

export function getEulaUrl(): string {
  return (
    (Constants.expoConfig?.extra?.eulaUrl as string) || "https://example.com/glyph/eula"
  );
}

export function shouldRequestAppleTracking(): boolean {
  const v = Constants.expoConfig?.extra?.requestAppleTracking;
  return v === true || v === "true" || v === 1;
}
