import { create } from "zustand";
import type { Hand, Mode } from "@/types";

interface Mapping {
  id: string;
  enabled: boolean;
  gesture: string;
  hand: Hand;
  address: string;
  mode: Mode;
}

interface RecognizerState {
  mappings: Mapping[];
}

export const useRecognizerStore = create<RecognizerState>((set, get) => ({
  mappings: [],

  addMapping: (m: Partial<Mapping>) => {
    const mappings = get().mappings;
    set({ mappings: [...mappings, m as Mapping] });
  },
  deleteMapping: (id: string) => {
    const mappings = get().mappings;
    set({ mappings: mappings.filter((m) => m.id !== id) });
  },
  updateMapping: (id: string, updates: Partial<Mapping>) => {
    const mappings = get().mappings;
    set({
      mappings: mappings.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    });
  },
}));
