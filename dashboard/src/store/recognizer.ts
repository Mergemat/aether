import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { create } from "zustand";
import perfLogger from "@/lib/utils/logger";

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
    perfLogger.storeUpdate("recognizer-store", "init called");
    const { recognizer, initializing } = get();
    if (recognizer) {
      perfLogger.storeUpdate("recognizer-store", "init already initialized");
      return recognizer;
    }
    if (initializing) {
      perfLogger.storeUpdate("recognizer-store", "init already initializing");
      return null; // Prevent double-init
    }

    perfLogger.storeUpdate("recognizer-store", "init started");
    set({ initializing: true });

    try {
      const startTime = performance.now();
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
      const endTime = performance.now();

      perfLogger.storeUpdate("recognizer-store", "init success", {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
      });
      set({ recognizer: instance, isReady: true, initializing: false });
      return instance;
    } catch (error) {
      perfLogger.storeUpdate("recognizer-store", "init failed", { error });
      set({ initializing: false });
      throw error;
    }
  },

  destroy: () => {
    perfLogger.storeUpdate("recognizer-store", "destroy called");
    const { recognizer } = get();
    if (recognizer) {
      recognizer.close();
      perfLogger.storeUpdate("recognizer-store", "destroy complete");
      set({ recognizer: null, isReady: false, initializing: false });
    } else {
      perfLogger.storeUpdate("recognizer-store", "destroy no instance");
    }
  },
}));
