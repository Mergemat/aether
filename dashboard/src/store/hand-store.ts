import { create } from "zustand";
import type { BothHandsData, GestureHandData, HandData } from "@/types";

interface HandState {
  gesture: string;
  gestureData: Record<string, HandData>;
  rot: number;
  y: number;
}

interface RecognitionStore {
  left: HandState;
  right: HandState;
  setHands: (hands: BothHandsData, tracked: number) => void;
  /** Hands in view, with or without a recognized gesture */
  tracked: number;
}

const initialHand = (): HandState => ({
  gesture: "None",
  y: 0,
  rot: 0,
  gestureData: {},
});

function nextHand(prev: HandState, data: GestureHandData): HandState {
  const { gesture, y, rot } = data;

  // Hand gone or no gesture: keep each gesture's last values for the monitors
  if (gesture === "None") {
    return prev.gesture === "None"
      ? prev
      : { ...prev, gesture: "None", y: 0, rot: 0 };
  }

  const existing = prev.gestureData[gesture];
  if (prev.gesture === gesture && existing?.y === y && existing.rot === rot) {
    return prev;
  }

  return {
    gesture,
    y,
    rot,
    gestureData: { ...prev.gestureData, [gesture]: { y, rot } },
  };
}

export const useHandStore = create<RecognitionStore>((set) => ({
  left: initialHand(),
  right: initialHand(),
  tracked: 0,

  // One update per frame for both hands, so subscribers run once
  setHands: (hands, tracked) =>
    set((state) => {
      const left = nextHand(state.left, hands.left);
      const right = nextHand(state.right, hands.right);
      if (
        left === state.left &&
        right === state.right &&
        tracked === state.tracked
      ) {
        return state;
      }
      return { left, right, tracked };
    }),
}));
