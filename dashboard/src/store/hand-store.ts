import { create } from "zustand";
import type { HandData } from "@/types";
import perfLogger from "@/lib/utils/logger";

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

      // perfLogger.storeUpdate("hand-store", `updateHand(${side})`, {
      //   gesture,
      //   y: y.toFixed(3),
      //   rot: rot.toFixed(3),
      //   prevGesture: prev.gesture,
      //   willUpdate: !(prev.gesture === gesture && prev.y === y && prev.rot === rot),
      // });

      if (prev.gesture === gesture && prev.y === y && prev.rot === rot) {
        return state;
      }

      return {
        [side]: {
          ...prev,
          gesture,
          ...data,
          gestureData: {
            ...prev.gestureData,
            [gesture]: data,
          },
        },
      };
    }),
}));
