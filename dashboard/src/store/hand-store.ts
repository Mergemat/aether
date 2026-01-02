import { create } from "zustand";
import type { HandData } from "@/types";

interface HandState {
  gesture: string;
  y: number;
  rot: number;
  gestureData: Record<string, HandData>;
}

interface RecognitionStore {
  left: HandState;
  right: HandState;
  updateHand: (side: "left" | "right", gesture: string, data: HandData) => void;
  resetHands: () => void;
}

const initialHand = (): HandState => ({
  gesture: "None",
  y: 0,
  rot: 0,
  gestureData: {},
});

export const useHandStore = create<RecognitionStore>((set) => ({
  left: initialHand(),
  right: initialHand(),

  updateHand: (side, gesture, data) =>
    set((state) => {
      const prev = state[side];
      const { y, rot } = data;

      // Check if gestureData for this gesture actually changed
      const existingGestureData = prev.gestureData[gesture];
      const gestureDataChanged =
        !existingGestureData ||
        existingGestureData.y !== y ||
        existingGestureData.rot !== rot;

      // Early return if nothing changed at all
      if (prev.gesture === gesture && !gestureDataChanged) {
        return state;
      }

      return {
        [side]: {
          ...prev,
          gesture,
          y,
          rot,
          // Only create new gestureData object if the data actually changed
          gestureData: gestureDataChanged
            ? { ...prev.gestureData, [gesture]: data }
            : prev.gestureData,
        },
      };
    }),

  resetHands: () =>
    set((state) => {
      // Only update if not already reset
      if (state.left.gesture === "None" && state.right.gesture === "None") {
        return state;
      }
      return {
        left: { ...state.left, gesture: "None", y: 0, rot: 0 },
        right: { ...state.right, gesture: "None", y: 0, rot: 0 },
      };
    }),
}));
