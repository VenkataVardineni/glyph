import { create } from "zustand";

export type LocalStroke = {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  brush: string;
};

type DrawingState = {
  color: string;
  width: number;
  brush: "neon" | "ink" | "fire" | "sparkles";
  strokes: LocalStroke[];
  remoteStrokes: LocalStroke[];
  setTool: (p: Partial<Pick<DrawingState, "color" | "width" | "brush">>) => void;
  addLocalStroke: (s: LocalStroke) => void;
  addRemoteStroke: (s: LocalStroke) => void;
  clearLocal: () => void;
  clearAll: () => void;
};

export const useDrawingStore = create<DrawingState>((set) => ({
  color: "#a78bfa",
  width: 4,
  brush: "neon",
  strokes: [],
  remoteStrokes: [],

  setTool: (p) => set(p),
  addLocalStroke: (s) => set((state) => ({ strokes: [...state.strokes, s] })),
  addRemoteStroke: (s) => set((state) => ({ remoteStrokes: [...state.remoteStrokes, s] })),
  clearLocal: () => set({ strokes: [] }),
  clearAll: () => set({ strokes: [], remoteStrokes: [] }),
}));
