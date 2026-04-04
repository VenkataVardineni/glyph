import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { EULA_VERSION } from "../legal/constants";

const KEYS = {
  onboarded: "glyph_onboarded",
  userId: "glyph_userId",
  safetyAccepted: "glyph_safety",
  eulaVersion: "glyph_eula_version",
  tutorialDone: "glyph_tutorial",
  tags: "glyph_tags",
  language: "glyph_language",
  drawingOnly: "glyph_drawing_only",
  waveToUnblur: "glyph_wave",
  translation: "glyph_translation",
  depth3d: "glyph_depth",
  brushPhysics: "glyph_brush_physics",
  blockedUserIds: "glyph_blocked_local",
} as const;

export type BrushPhysics = "none" | "gravity" | "dissolve";

type SessionState = {
  hydrated: boolean;
  onboarded: boolean;
  userId: string | null;
  safetyAccepted: boolean;
  eulaAcceptedVersion: string | null;
  tutorialDone: boolean;
  tags: string[];
  language: string;
  drawingOnly: boolean;
  waveToUnblur: boolean;
  translationEnabled: boolean;
  depth3d: boolean;
  brushPhysics: BrushPhysics;
  blockedUserIds: string[];
  hydrate: () => Promise<void>;
  setUserId: (id: string) => Promise<void>;
  acceptSafety: () => Promise<void>;
  acceptEula: () => Promise<void>;
  completeTutorial: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
  /** Banned or terminated — clears account and forces re-onboarding. */
  accountTerminated: () => Promise<void>;
  setTags: (tags: string[]) => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  setDrawingOnly: (v: boolean) => Promise<void>;
  setWaveToUnblur: (v: boolean) => Promise<void>;
  setTranslationEnabled: (v: boolean) => Promise<void>;
  setDepth3d: (v: boolean) => Promise<void>;
  setBrushPhysics: (p: BrushPhysics) => Promise<void>;
  addBlockedUserId: (id: string) => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  hydrated: false,
  onboarded: false,
  userId: null,
  safetyAccepted: false,
  eulaAcceptedVersion: null,
  tutorialDone: false,
  tags: [],
  language: "any",
  drawingOnly: false,
  waveToUnblur: true,
  translationEnabled: false,
  depth3d: false,
  brushPhysics: "none",
  blockedUserIds: [],

  hydrate: async () => {
    try {
      const entries = await AsyncStorage.multiGet(Object.values(KEYS));
      const map = Object.fromEntries(entries) as Record<string, string | null>;
      let tags: string[] = [];
      let blockedUserIds: string[] = [];
      try {
        if (map[KEYS.tags]) tags = JSON.parse(map[KEYS.tags]!);
      } catch {
        /* ignore corrupt storage */
      }
      try {
        if (map[KEYS.blockedUserIds]) blockedUserIds = JSON.parse(map[KEYS.blockedUserIds]!);
      } catch {
        /* ignore corrupt storage */
      }
      set({
        hydrated: true,
        onboarded: map[KEYS.onboarded] === "1",
        userId: map[KEYS.userId],
        safetyAccepted: map[KEYS.safetyAccepted] === "1",
        eulaAcceptedVersion: map[KEYS.eulaVersion],
        tutorialDone: map[KEYS.tutorialDone] === "1",
        tags,
        language: map[KEYS.language] ?? "any",
        drawingOnly: map[KEYS.drawingOnly] === "1",
        waveToUnblur: map[KEYS.waveToUnblur] !== "0",
        translationEnabled: map[KEYS.translation] === "1",
        depth3d: map[KEYS.depth3d] === "1",
        brushPhysics: (map[KEYS.brushPhysics] as BrushPhysics) || "none",
        blockedUserIds,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setUserId: async (id: string) => {
    await AsyncStorage.setItem(KEYS.userId, id);
    set({ userId: id });
  },

  acceptSafety: async () => {
    await AsyncStorage.setItem(KEYS.safetyAccepted, "1");
    set({ safetyAccepted: true });
  },

  acceptEula: async () => {
    await AsyncStorage.setItem(KEYS.eulaVersion, EULA_VERSION);
    set({ eulaAcceptedVersion: EULA_VERSION });
  },

  completeTutorial: async () => {
    await AsyncStorage.setItem(KEYS.tutorialDone, "1");
    set({ tutorialDone: true });
  },

  finishOnboarding: async () => {
    await AsyncStorage.setItem(KEYS.onboarded, "1");
    set({ onboarded: true });
  },

  accountTerminated: async () => {
    await AsyncStorage.multiRemove([
      KEYS.userId,
      KEYS.onboarded,
      KEYS.tutorialDone,
      KEYS.safetyAccepted,
      KEYS.eulaVersion,
      KEYS.blockedUserIds,
    ]);
    set({
      userId: null,
      onboarded: false,
      tutorialDone: false,
      safetyAccepted: false,
      eulaAcceptedVersion: null,
      blockedUserIds: [],
    });
  },

  setTags: async (tags) => {
    const t = tags.slice(0, 3);
    await AsyncStorage.setItem(KEYS.tags, JSON.stringify(t));
    set({ tags: t });
  },

  setLanguage: async (language) => {
    await AsyncStorage.setItem(KEYS.language, language);
    set({ language });
  },

  setDrawingOnly: async (drawingOnly) => {
    await AsyncStorage.setItem(KEYS.drawingOnly, drawingOnly ? "1" : "0");
    set({ drawingOnly });
  },

  setWaveToUnblur: async (waveToUnblur) => {
    await AsyncStorage.setItem(KEYS.waveToUnblur, waveToUnblur ? "1" : "0");
    set({ waveToUnblur });
  },

  setTranslationEnabled: async (translationEnabled) => {
    await AsyncStorage.setItem(KEYS.translation, translationEnabled ? "1" : "0");
    set({ translationEnabled });
  },

  setDepth3d: async (depth3d) => {
    await AsyncStorage.setItem(KEYS.depth3d, depth3d ? "1" : "0");
    set({ depth3d });
  },

  setBrushPhysics: async (brushPhysics) => {
    await AsyncStorage.setItem(KEYS.brushPhysics, brushPhysics);
    set({ brushPhysics });
  },

  addBlockedUserId: async (id: string) => {
    const next = [...new Set([...get().blockedUserIds, id])];
    await AsyncStorage.setItem(KEYS.blockedUserIds, JSON.stringify(next));
    set({ blockedUserIds: next });
  },
}));

export function onboardingStep():
  | "sign-in"
  | "safety"
  | "eula"
  | "tutorial"
  | "done" {
  const s = useSessionStore.getState();
  if (!s.userId) return "sign-in";
  if (!s.safetyAccepted) return "safety";
  if (s.eulaAcceptedVersion !== EULA_VERSION) return "eula";
  if (!s.tutorialDone) return "tutorial";
  return "done";
}
