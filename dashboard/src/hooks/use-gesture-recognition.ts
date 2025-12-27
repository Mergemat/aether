import {
  DrawingUtils,
  FilesetResolver,
  GestureRecognizer,
  type GestureRecognizerResult,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import { processHandLandmarks } from "@/lib/utils/hand-processing";
import perfLogger from "@/lib/utils/logger";
import { useHandStore } from "@/store/hand-store";

interface HandData {
  gesture: string;
  y: number;
  rot: number;
}

interface UseGestureRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  drawLandmarks?: boolean;
  onHandData?: (handData: { left: HandData; right: HandData }) => void;
}

interface UseGestureRecognitionReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startDetection: () => void;
  stopDetection: () => void;
  isLoading: boolean;
  loadingProgress: string;
  error: string | null;
}

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

function cleanupTimeouts(timeouts: Set<ReturnType<typeof setTimeout>>): void {
  for (const timeoutId of timeouts) {
    clearTimeout(timeoutId);
  }
  timeouts.clear();
}

function cancelFrame(frameRef: React.RefObject<number | null>): void {
  if (frameRef.current !== null) {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }
}

export const useGestureRecognition = ({
  videoRef,
  drawLandmarks = true,
  onHandData,
}: UseGestureRecognitionProps): UseGestureRecognitionReturn => {
  perfLogger.hookInit("useGestureRecognition", { drawLandmarks });

  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] =
    useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const frameCountRef = useRef(0);

  // Refs for cleanup - CRITICAL for preventing memory leaks
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set()
  );

  // Store references to avoid stale closures in animation loop
  const onHandDataRef = useRef(onHandData);
  const drawLandmarksRef = useRef(drawLandmarks);

  useEffect(() => {
    onHandDataRef.current = onHandData;
  }, [onHandData]);

  useEffect(() => {
    drawLandmarksRef.current = drawLandmarks;
  }, [drawLandmarks]);

  const updateHand = useHandStore((state) => state.updateHand);

  // Initialize recognizer
  useEffect(() => {
    let mounted = true;

    const initRecognizer = async () => {
      perfLogger.event("useGestureRecognition", "lazy init started");
      setLoadingProgress("Loading MediaPipe WASM...");

      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      if (!mounted) {
        perfLogger.event(
          "useGestureRecognition",
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
        runningMode: "VIDEO",
        numHands: 2,
      });

      if (!mounted) {
        // CRITICAL: Close the instance if we unmounted during creation
        perfLogger.event(
          "useGestureRecognition",
          "aborted - unmounted during model load, closing instance"
        );
        instance.close();
        return;
      }

      recognizerRef.current = instance;
      setIsLoading(false);
      perfLogger.event("useGestureRecognition", "lazy init complete");
    };

    initRecognizer().catch((err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      perfLogger.event("useGestureRecognition", `lazy init failed ${message}`);
      if (mounted) {
        setError(message || "Failed to initialize recognizer");
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      perfLogger.hookCleanup("useGestureRecognition");
      isRunningRef.current = false;

      cancelFrame(animationFrameRef);
      perfLogger.event("useGestureRecognition", "animation frame cancelled");

      cleanupTimeouts(pendingTimeoutsRef.current);
      perfLogger.event("useGestureRecognition", "pending timeouts cleared");

      if (recognizerRef.current) {
        recognizerRef.current.close();
        recognizerRef.current = null;
        perfLogger.event("useGestureRecognition", "recognizer closed");
      }

      drawingUtilsRef.current = null;
    };
  }, []);

  const drawLandmarksOnCanvas = (results: GestureRecognizerResult) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.landmarks) {
      return;
    }

    if (!drawingUtilsRef.current) {
      drawingUtilsRef.current = new DrawingUtils(ctx);
    }

    for (const landmarks of results.landmarks) {
      drawingUtilsRef.current.drawConnectors(
        landmarks,
        HandLandmarker.HAND_CONNECTIONS
      );
      drawingUtilsRef.current.drawLandmarks(landmarks);
    }
  };

  const stopDetection = () => {
    perfLogger.event("useGestureRecognition", "stopDetection called");
    isRunningRef.current = false;
    cancelFrame(animationFrameRef);
    cleanupTimeouts(pendingTimeoutsRef.current);
  };

  const startDetection = () => {
    perfLogger.event("useGestureRecognition", "startDetection called");

    if (isRunningRef.current) {
      perfLogger.event(
        "useGestureRecognition",
        "startDetection skipped - already running"
      );
      return;
    }

    isRunningRef.current = true;

    const processLandmark = (
      results: GestureRecognizerResult,
      index: number,
      handData: { left: HandData; right: HandData }
    ) => {
      const landmarks = results.landmarks[index];
      const gesture = results.gestures?.[index]?.[0]?.categoryName ?? "None";
      const handedness = results.handedness[index][0].categoryName;
      const side = handedness.toLowerCase() as "left" | "right";

      if (gesture === "None") {
        return;
      }

      const rawData = processHandLandmarks(landmarks, handedness);
      updateHand(side, gesture, rawData);

      handData[side] = {
        gesture,
        y: rawData.y,
        rot: rawData.rot,
      };
    };

    const processResults = (results: GestureRecognizerResult) => {
      if (!results.landmarks?.length) {
        return;
      }

      const handData: { left: HandData; right: HandData } = {
        left: { gesture: "None", y: 0, rot: 0 },
        right: { gesture: "None", y: 0, rot: 0 },
      };

      for (let i = 0; i < results.landmarks.length; i++) {
        processLandmark(results, i, handData);
      }

      onHandDataRef.current?.(handData);
    };

    const scheduleDraw = (results: GestureRecognizerResult) => {
      const timeoutId = setTimeout(() => {
        pendingTimeoutsRef.current.delete(timeoutId);
        if (isRunningRef.current) {
          drawLandmarksOnCanvas(results);
        }
      }, 0);
      pendingTimeoutsRef.current.add(timeoutId);
    };

    const loop = () => {
      if (!isRunningRef.current) {
        perfLogger.event("useGestureRecognition", "loop stopped - not running");
        return;
      }

      const video = videoRef.current;
      const recognizer = recognizerRef.current;
      const isVideoReady = video && recognizer && video.readyState === 4;

      if (!isVideoReady) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      frameCountRef.current++;

      const results = recognizer.recognizeForVideo(video, performance.now());
      processResults(results);

      if (drawLandmarksRef.current) {
        scheduleDraw(results);
      }

      if (isRunningRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    loop();
  };

  return {
    canvasRef,
    startDetection,
    stopDetection,
    isLoading,
    loadingProgress,
    error,
  };
};
