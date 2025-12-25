import { atom } from "jotai";
import { selectAtom } from "jotai/utils";
import type { HandData, Mapping } from "./types";

export const currentHandDataAtom = atom<{
  left: HandData | null;
  right: HandData | null;
}>({ left: null, right: null });

export const activeGesturesAtom = atom<{ left: string; right: string }>({
  left: "None",
  right: "None",
});

export const mappingsAtom = atom<Mapping[]>([]);

export const liveValuesAtom = atom<Record<string, number>>({});

export const isReadyAtom = atom(false);

export const selectMappingValueAtom = (id: string) =>
  selectAtom(
    liveValuesAtom,
    (values) => values[id] ?? 0,
    (a, b) => a === b
  );
