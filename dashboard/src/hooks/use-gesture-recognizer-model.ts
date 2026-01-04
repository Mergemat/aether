import {
  GestureRecognizer,
  type GestureRecognizerOptions,
} from "@mediapipe/tasks-vision";
import { use } from "react";
import { getTask } from "@/lib/core/resolver";

const DEFAULT_OPTIONS: GestureRecognizerOptions = {
  baseOptions: {
    modelAssetPath:
      "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
    delegate: "GPU",
  },
  cannedGesturesClassifierOptions: {
    categoryDenylist: ["Thumbs_Up", "Thumbs_Down"],
  },
  runningMode: "VIDEO",
  minHandDetectionConfidence: 0.9,
  numHands: 2,
};

export function useGestureRecognizer(
  options?: Partial<GestureRecognizerOptions>
) {
  return use(
    getTask<GestureRecognizer>("gesture", (vision) =>
      GestureRecognizer.createFromOptions(vision, {
        ...DEFAULT_OPTIONS,
        ...options,
      })
    )
  );
}
