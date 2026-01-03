import { create } from "zustand";
import { useHandStore } from "./hand-store";

interface SwitchStateStore {
  // Key: `${hand}-${gesture}`, Value: boolean (on/off)
  states: Record<string, boolean>;
  toggle: (key: string) => void;
}

export const useSwitchStateStore = create<SwitchStateStore>((set) => ({
  states: {},
  toggle: (key) =>
    set((state) => ({
      states: { ...state.states, [key]: !state.states[key] },
    })),
}));

// Track which gesture is currently "held" per hand (to prevent re-triggering)
const activeGesture: Record<string, string | null> = {
  left: null,
  right: null,
};

// Subscribe to hand store changes and toggle switch state on rising edge
useHandStore.subscribe((state) => {
  for (const hand of ["left", "right"] as const) {
    const gesture = state[hand].gesture;

    if (gesture === "None") {
      // Hand released - clear active gesture
      activeGesture[hand] = null;
    } else if (activeGesture[hand] !== gesture) {
      // New gesture detected (and not already active) - toggle and mark as active
      activeGesture[hand] = gesture;
      const key = `${hand}-${gesture}`;
      useSwitchStateStore.getState().toggle(key);
    }
  }
});

export function useSwitchState(hand: string, gesture: string): boolean {
  const key = `${hand}-${gesture}`;
  const value = useSwitchStateStore((state) => {
    return state.states[key] ?? false;
  });
  return value;
}
