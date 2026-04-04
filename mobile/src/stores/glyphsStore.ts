import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "glyph_saved_sessions";

export type SavedGlyph = {
  id: string;
  title: string;
  createdAt: number;
  note?: string;
};

type GlyphsState = {
  items: SavedGlyph[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  consentSave: (title: string, note?: string) => Promise<void>;
};

export const useGlyphsStore = create<GlyphsState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(KEY);
    const items = raw ? (JSON.parse(raw) as SavedGlyph[]) : [];
    set({ items, hydrated: true });
  },

  consentSave: async (title, note) => {
    const item: SavedGlyph = {
      id: `${Date.now()}`,
      title,
      createdAt: Date.now(),
      note,
    };
    const next = [item, ...get().items];
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    set({ items: next });
  },
}));
