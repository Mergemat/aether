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
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const onHandDataRef = useRef(onHandData);
  const drawLandmarksRef = useRef(drawLandmarks);

  // Keep refs in sync
  onHandDataRef.current = onHandData;
  drawLandmarksRef.current = drawLandmarks;

  const updateHand = useHandStore((state) => state.updateHand);

  const { recognizer, isLoading, loadingProgress, error } =
    useGestureRecognizerModel();

  const drawLandmarksOnCanvas = useCallback(
    (results: GestureRecognizerResult) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!results.landmarks?.length) {
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
    },
    []
  );

  const handleResults = useCallback(
    (results: GestureRecognizerResult) => {
      if (drawLandmarksRef.current) {
        drawLandmarksOnCanvas(results);
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

        const rawData = processHandLandmarks(landmarks, handedness);
        updateHand(side, gesture, rawData);

        handData[side] = {
          gesture,
          y: rawData.y,
          rot: rawData.rot,
        };
      }

      onHandDataRef.current?.(handData);
    },
    [drawLandmarksOnCanvas, updateHand]
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
