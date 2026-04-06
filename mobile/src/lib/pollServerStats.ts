import { getServerUrl } from "./config";
import { useMatchStore } from "../stores/matchStore";

/** Pulls `/stats` and updates lobby online hint. Safe to call from intervals. */
export async function fetchOnlineCount(): Promise<void> {
  const url = getServerUrl();
  try {
    const res = await fetch(`${url}/stats`);
    const j = (await res.json()) as { online?: number };
    if (typeof j.online === "number") {
      useMatchStore.getState().setOnlineHint(j.online);
    }
  } catch {
    /* offline or CORS in dev — ignore */
  }
}
