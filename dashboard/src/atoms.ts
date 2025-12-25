import { atom } from "jotai";
import { selectAtom } from "jotai/utils";
import type { HandData, Mapping } from "./types";

export const currentHandDataAtom = atom<{
  left: HandData | null;
  right: HandData | null;
}>({ left: null, right: null });

export const mappingsAtom = atom<Mapping[]>([]);

// Assuming liveValuesAtom is: Record<string, number>
export const liveValuesAtom = atom<Record<string, number>>({});

// Create a memoized selector for a specific mapping ID
export const selectMappingValueAtom = (id: string) =>
  selectAtom(
    liveValuesAtom,
    (values) => values[id] ?? 0,
    (a, b) => a === b // Only update if the number actually changes
  );

export const mappingsWithValuesAtom = atom((get) => {
  const mappings = get(mappingsAtom);
  const liveValues = get(liveValuesAtom);
  return mappings.map((m) => ({
    ...m,
    value: liveValues[m.id] ?? 0,
  }));
});

export const activeGesturesAtom = atom<{ left: string; right: string }>({
  left: "—",
  right: "—",
});

export const isReadyAtom = atom(false);
