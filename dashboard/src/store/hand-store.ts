import { create } from "zustand";
import { clamp } from "@/lib/utils/clamp";
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

      const processed = {
        y: Math.round(clamp(data.y, 0, 1) * 100) / 100,
        rot: Math.round(clamp(data.rot, 0, 1) * 100) / 100,
      };

      if (
        prev.gesture === gesture &&
        prev.y === processed.y &&
        prev.rot === processed.rot
      ) {
        return state;
      }

      return {
        [side]: {
          ...prev,
          gesture,
          ...processed,
          gestureData: {
            ...prev.gestureData,
            [gesture]: processed,
          },
        },
      };
    }),
}));
