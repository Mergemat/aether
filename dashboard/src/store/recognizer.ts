import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { create } from "zustand";

interface RecognizerState {
  recognizer: GestureRecognizer | null;
  isReady: boolean;
  initializing: boolean; // Add this to track status
  init: () => Promise<GestureRecognizer | null>;
  destroy: () => void;
}

export const useRecognizerStore = create<RecognizerState>((set, get) => ({
  recognizer: null,
  isReady: false,
  initializing: false,

  init: async () => {
    const { recognizer, initializing } = get();
    if (recognizer) {
      return recognizer;
    }
    if (initializing) {
      return null; // Prevent double-init
    }

    set({ initializing: true });

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const instance = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });

      set({ recognizer: instance, isReady: true, initializing: false });
      return instance;
    } catch (error) {
      set({ initializing: false });
      throw error;
    }
  },

  destroy: () => {
    const { recognizer } = get();
    if (recognizer) {
      recognizer.close();
      set({ recognizer: null, isReady: false, initializing: false });
    }
  },
}));
