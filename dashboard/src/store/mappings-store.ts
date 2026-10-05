import { create } from "zustand";
import { persist } from "zustand/middleware";

import { GESTURES } from "@/lib/constants";
import type { Mapping } from "@/types";

const GESTURE_INDEX_MAP = new Map<string, number>(
  GESTURES.map((g, i) => [g, i])
);

const getGestureIndex = (gesture: string | undefined): number =>
  gesture === undefined ? -1 : (GESTURE_INDEX_MAP.get(gesture) ?? -1);

interface MappingsState {
  addMapping: (m: Omit<Mapping, "id" | "address">) => void;
  deleteMapping: (id: string) => void;
  /** Enable all mappings (un-isolate) */
  enableAllMappings: () => void;
  /** Isolate a mapping by disabling all others */
  isolateMapping: (id: string) => void;
  mappings: Mapping[];
  reorderMappings: (mappings: Mapping[]) => void;
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

      reorderMappings: (mappings: Mapping[]) => {
        set({ mappings });
      },

      addMapping: (m: Omit<Mapping, "id" | "address">) => {
        const { mappings } = get();

        const mapping: Mapping = {
          ...m,
          id: crypto.randomUUID(),
          address: `/${m.hand}/${getGestureIndex(m.gesture)}/${m.mode}`,
        };

        set({ mappings: [...mappings, mapping] });
      },
      deleteMapping: (id: string) => {
        const { mappings } = get();
        set({ mappings: mappings.filter((m) => m.id !== id) });
      },
      updateMapping: (id: string, updates: Partial<Mapping>) => {
        const { mappings } = get();
        const mapping = mappings.find((m) => m.id === id);
        if (!mapping) {
          return;
        }

        const updated = {
          ...mapping,
          ...updates,
        };
        updated.address = `/${updated.hand}/${getGestureIndex(updated.gesture)}/${updated.mode}`;
        set({ mappings: mappings.map((m) => (m.id === id ? updated : m)) });
      },

      isolateMapping: (id: string) => {
        const { mappings } = get();
        set({
          mappings: mappings.map((m) => ({
            ...m,
            enabled: m.id === id,
          })),
        });
      },

      enableAllMappings: () => {
        const { mappings } = get();
        set({
          mappings: mappings.map((m) => ({
            ...m,
            enabled: true,
          })),
        });
      },
    }),
    {
      name: "aether:mappings",
    }
  )
);
