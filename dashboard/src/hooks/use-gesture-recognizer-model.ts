import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import perfLogger from "@/lib/utils/logger";

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
      perfLogger.event("useGestureRecognizerModel", "init started");
      setLoadingProgress("Loading MediaPipe WASM...");

      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      if (!mounted) {
        perfLogger.event(
          "useGestureRecognizerModel",
          "aborted - unmounted during WASM load"
        );
        return;
      }

      setLoadingProgress("Loading gesture recognizer model...");

      const instance = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU",
        },
        customGesturesClassifierOptions: {
          scoreThreshold: 0.4,
        },
        minTrackingConfidence: 0.4,
        minHandDetectionConfidence: 0.4,
        runningMode: "VIDEO",
        numHands: 2,
      });

      if (!mounted) {
        perfLogger.event(
          "useGestureRecognizerModel",
          "aborted - unmounted during model load, closing instance"
        );
        instance.close();
        return;
      }

      recognizerRef.current = instance;
      setRecognizer(instance); // Trigger re-render with actual recognizer
      setIsLoading(false);
      perfLogger.event("useGestureRecognizerModel", "init complete");
    };

    initRecognizer().catch((err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      perfLogger.event("useGestureRecognizerModel", `init failed: ${message}`);
      if (mounted) {
        setError(message || "Failed to initialize recognizer");
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      perfLogger.hookCleanup("useGestureRecognizerModel");

      if (recognizerRef.current) {
        recognizerRef.current.close();
        recognizerRef.current = null;
        perfLogger.event("useGestureRecognizerModel", "recognizer closed");
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
