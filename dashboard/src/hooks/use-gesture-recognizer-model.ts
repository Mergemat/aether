import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

interface UseGestureRecognizerModelReturn {
  recognizer: GestureRecognizer | null;
  isLoading: boolean;
  loadingProgress: string;
  error: string | null;
}

export function useGestureRecognizerModel(): UseGestureRecognizerModelReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] =
    useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  // State to trigger re-render when recognizer is ready (ref alone won't cause re-render)
  const [recognizer, setRecognizer] = useState<GestureRecognizer | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);

  useEffect(() => {
    let mounted = true;

    const initRecognizer = async () => {
      setLoadingProgress("Loading MediaPipe WASM...");

      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      if (!mounted) {
        return;
      }

      setLoadingProgress("Loading gesture recognizer model...");

      const createRecognizer = (delegate: "GPU" | "CPU") => {
        return GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate,
          },
          cannedGesturesClassifierOptions: {
            scoreThreshold: 0.5,
            categoryDenylist: ["Thumb_Up", "Thumb_Down"],
          },
          minHandDetectionConfidence: 0.9,
          runningMode: "VIDEO",
          numHands: 2,
        });
      };

      let instance: GestureRecognizer;
      try {
        instance = await createRecognizer("GPU");
      } catch {
        instance = await createRecognizer("CPU");
      }

      if (!mounted) {
        instance.close();
        return;
      }

      recognizerRef.current = instance;
      setRecognizer(instance);
      setIsLoading(false);
    };

    initRecognizer().catch((err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (mounted) {
        setError(message || "Failed to initialize recognizer");
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;

      if (recognizerRef.current) {
        recognizerRef.current.close();
        recognizerRef.current = null;
      }
    };
  }, []);

  return {
    recognizer, // Use state instead of ref for proper re-render
    isLoading,
    loadingProgress,
    error,
  };
}
