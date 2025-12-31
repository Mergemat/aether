import { create } from "zustand";
import { persist } from "zustand/middleware";

import { GESTURES } from "@/lib/constants";
import perfLogger from "@/lib/utils/logger";
import type { Mapping } from "@/types";

const GESTURE_INDEX_MAP = new Map<string, number>(
  GESTURES.map((g, i) => [g, i])
);

const getGestureIndex = (gesture: string | undefined): number =>
  gesture !== undefined ? (GESTURE_INDEX_MAP.get(gesture) ?? -1) : -1;

interface MappingsState {
  mappings: Mapping[];
  addMapping: (m: Omit<Mapping, "id" | "address">) => void;
  deleteMapping: (id: string) => void;
  updateMapping: (id: string, updates: Partial<Mapping>) => void;
  reorderMappings: (mappings: Mapping[]) => void;
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
        perfLogger.storeUpdate("mappings-store", "addMapping", { m });
        const mappings = get().mappings;

        const mapping: Mapping = {
          ...m,
          id: crypto.randomUUID(),
          address: `/${m.hand}/${getGestureIndex(m.gesture)}/${m.mode}`,
        };

        set({ mappings: [...mappings, mapping] });
        perfLogger.storeUpdate("mappings-store", "addMapping complete", {
          id: mapping.id,
          address: mapping.address,
        });
      },
      deleteMapping: (id: string) => {
        perfLogger.storeUpdate("mappings-store", "deleteMapping", { id });
        const mappings = get().mappings;
        set({ mappings: mappings.filter((m) => m.id !== id) });
      },
      updateMapping: (id: string, updates: Partial<Mapping>) => {
        perfLogger.storeUpdate("mappings-store", "updateMapping", {
          id,
          updates,
        });
        const mappings = get().mappings;
        const mapping = mappings.find((m) => m.id === id);
        if (!mapping) {
          perfLogger.storeUpdate("mappings-store", "updateMapping failed", {
            reason: "mapping not found",
            id,
          });
          return;
        }

        const updated = {
          ...mapping,
          ...updates,
        };
        updated.address = `/${updated.hand}/${getGestureIndex(updated.gesture)}/${updated.mode}`;
        set({ mappings: mappings.map((m) => (m.id === id ? updated : m)) });
      },
    }),
    {
      name: "aether:mappings",
    }
  )
);
