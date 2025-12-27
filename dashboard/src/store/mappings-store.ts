import { create } from "zustand";
import { GESTURES } from "@/lib/constants";
import type { Hand, Mode } from "@/types";

interface Mapping {
  id: string;
  enabled: boolean;
  gesture: string;
  hand: Hand;
  address: string;
  mode: Mode;
}

interface MappingsState {
  mappings: Mapping[];
  addMapping: (m: Omit<Mapping, "id" | "address">) => void;
  deleteMapping: (id: string) => void;
  updateMapping: (id: string, updates: Partial<Mapping>) => void;
}

export const useMappingsStore = create<MappingsState>((set, get) => ({
  mappings: [
    {
      id: "1",
      hand: "right",
      gesture: "open", // Make sure this matches a gesture you see in the panel
      address: "/1/fader1",
      mode: "fader",
      enabled: true,
    },
  ],

  addMapping: (m: Omit<Mapping, "id" | "address">) => {
    const mappings = get().mappings;

    const mapping: Mapping = {
      ...m,
      id: crypto.randomUUID(),
      address: `/${m.hand}/${GESTURES.indexOf(m.gesture ?? "")}/${m.mode}`,
    };

    set({ mappings: [...mappings, mapping] });
  },
  deleteMapping: (id: string) => {
    const mappings = get().mappings;
    set({ mappings: mappings.filter((m) => m.id !== id) });
  },
  updateMapping: (id: string, updates: Partial<Mapping>) => {
    const mappings = get().mappings;
    set({
      mappings: mappings.map((m) =>
        m.id === id
          ? {
              ...m,
              ...updates,
              address: `/${m.hand}/${GESTURES.indexOf(m.gesture ?? "")}/${m.mode}`,
            }
          : m
      ),
    });
  },
}));
