import { create } from "zustand";
import { persist } from "zustand/middleware";

import { GESTURES } from "@/lib/constants";
import type { Mapping } from "@/types";

interface MappingsState {
  mappings: Mapping[];
  addMapping: (m: Omit<Mapping, "id" | "address">) => void;
  deleteMapping: (id: string) => void;
  updateMapping: (id: string, updates: Partial<Mapping>) => void;
}

export const useMappingsStore = create<MappingsState>()(
  persist(
    (set, get) => ({
      mappings: [
        {
          id: "1",
          hand: "right",
          gesture: "Open_Palm",
          mode: "fader",
          enabled: true,
          address: "/right/0/fader",
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
        const mapping = mappings.find((m) => m.id === id);
        if (!mapping) {
          return;
        }

        const updated = {
          ...mapping,
          ...updates,
        };
        updated.address = `/${updated.hand}/${GESTURES.indexOf(updated.gesture)}/${updated.mode}`;
        set({ mappings: mappings.map((m) => (m.id === id ? updated : m)) });
      },
    }),
    {
      name: "aether:mappings",
    }
  )
);
