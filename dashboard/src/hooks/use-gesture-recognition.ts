import {
  DrawingUtils,
  type GestureRecognizerResult,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { useCallback, useRef } from "react";
import { processHandLandmarks } from "@/lib/utils/hand-processing";
import perfLogger from "@/lib/utils/logger";
import { useHandStore } from "@/store/hand-store";
import type { BothHandsData, GestureHandData } from "@/types";
import { useDetectionLoop } from "./use-detection-loop";
import { useGestureRecognizerModel } from "./use-gesture-recognizer-model";

interface UseGestureRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  drawLandmarks?: boolean;
  onHandData?: (handData: BothHandsData) => void;
}

interface UseGestureRecognitionReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startDetection: () => void;
  stopDetection: () => void;
  isLoading: boolean;
  loadingProgress: string;
  error: string | null;
}

const DEFAULT_HAND_DATA: GestureHandData = { gesture: "None", y: 0, rot: 0 };

export const useGestureRecognition = ({
  videoRef,
  drawLandmarks = true,
  onHandData,
}: UseGestureRecognitionProps): UseGestureRecognitionReturn => {
  perfLogger.hookInit("useGestureRecognition", { drawLandmarks });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const onHandDataRef = useRef(onHandData);
  const drawLandmarksRef = useRef(drawLandmarks);
  const wasDrawingRef = useRef(false);

  // Keep refs in sync
  onHandDataRef.current = onHandData;
  drawLandmarksRef.current = drawLandmarks;

  const updateHand = useHandStore((state) => state.updateHand);

  const { recognizer, isLoading, loadingProgress, error } =
    useGestureRecognizerModel();

  const drawOnCanvas = useCallback((results: GestureRecognizerResult) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // Cache canvas context in ref to avoid getContext call every frame
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d", { alpha: true });
    }
    const ctx = ctxRef.current;
    if (!ctx) {
      return;
    }

    // Initialize DrawingUtils if not already done
    if (!drawingUtilsRef.current) {
      drawingUtilsRef.current = new DrawingUtils(ctx);
    }
    const drawingUtils = drawingUtilsRef.current;

    // Only clear if we have landmarks or were drawing before
    if (!results.landmarks?.length) {
      if (wasDrawingRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        wasDrawingRef.current = false;
      }
      return;
    }

    wasDrawingRef.current = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#fff",
        lineWidth: 2,
      });
      // drawingUtils.drawLandmarks(landmarks, {
      //   color: "#22c55e",
      //   radius: 3,
      // });
    }
  }, []);

  const handleResults = useCallback(
    (results: GestureRecognizerResult) => {
      if (drawLandmarksRef.current) {
        drawOnCanvas(results);
      }

      if (!results.landmarks?.length) {
        return;
      }

      const handData: BothHandsData = {
        left: { ...DEFAULT_HAND_DATA },
        right: { ...DEFAULT_HAND_DATA },
      };

      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const gesture = results.gestures?.[i]?.[0]?.categoryName ?? "None";
        const handedness = results.handedness[i][0].categoryName;
        const side = handedness.toLowerCase() as "left" | "right";

        if (gesture === "None") {
          continue;
        }

        const rawData = processHandLandmarks(landmarks, handedness, gesture);
        updateHand(side, gesture, rawData);

        handData[side] = {
          gesture,
          y: rawData.y,
          rot: rawData.rot,
        };
      }

      onHandDataRef.current?.(handData);
    },
    [drawOnCanvas, updateHand]
  );

  const { start, stop } = useDetectionLoop({
    videoRef,
    recognizer,
    onResults: handleResults,
  });

  return {
    canvasRef,
    startDetection: start,
    stopDetection: stop,
    isLoading,
    loadingProgress,
    error,
  };
};
