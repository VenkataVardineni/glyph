import Constants from "expo-constants";

export function getServerUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.serverUrl as string | undefined;
  return fromExtra?.replace(/\/$/, "") ?? "http://127.0.0.1:3001";
}
