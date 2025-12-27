import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";

let instance: GestureRecognizer | null = null;

export const createGestureRecognizer = async (): Promise<GestureRecognizer> => {
  if (instance) {
    return instance;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  instance = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  return instance;
};

export const closeGestureRecognizer = (): void => {
  if (instance) {
    instance.close();
    instance = null;
  }
};
