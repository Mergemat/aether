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

      // Early return if nothing changed
      if (prev.gesture === gesture && prev.y === y && prev.rot === rot) {
        return state;
      }

      // Check if gestureData for this gesture actually changed
      const existingGestureData = prev.gestureData[gesture];
      const gestureDataChanged =
        !existingGestureData ||
        existingGestureData.y !== y ||
        existingGestureData.rot !== rot;

      return {
        [side]: {
          ...prev,
          gesture,
          ...data,
          // Only create new gestureData object if the data actually changed
          gestureData: gestureDataChanged
            ? { ...prev.gestureData, [gesture]: data }
            : prev.gestureData,
        },
      };
    }),
}));
