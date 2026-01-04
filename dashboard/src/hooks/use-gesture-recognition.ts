import type { GestureRecognizerResult } from "@mediapipe/tasks-vision";
import { useCallback, useRef } from "react";
import { drawHandResults } from "@/lib/utils/hand-drawer";
import { processHandLandmarks } from "@/lib/utils/hand-processing";
import { useHandStore } from "@/store/hand-store";
import type { BothHandsData, GestureHandData } from "@/types";
import { useDetectionLoop } from "./use-detection-loop";
import { useGestureRecognizer } from "./use-gesture-recognizer-model";

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

const processResults = (
  results: GestureRecognizerResult,
  updateHand: (
    side: "left" | "right",
    gesture: string,
    data: { y: number; rot: number }
  ) => void
): BothHandsData => {
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

    handData[side] = { gesture, y: rawData.y, rot: rawData.rot };
  }

  return handData;
};

export const useGestureRecognition = ({
  videoRef,
  drawLandmarks = true,
  onHandData,
}: UseGestureRecognitionProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const onHandDataRef = useRef(onHandData);
  const drawLandmarksRef = useRef(drawLandmarks);
  const wasDrawingRef = useRef(false);

  // Keep refs in sync
  onHandDataRef.current = onHandData;
  drawLandmarksRef.current = drawLandmarks;

  const updateHand = useHandStore((state) => state.updateHand);
  const resetHands = useHandStore((state) => state.resetHands);

  const recognizer = useGestureRecognizer();

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d", { alpha: true });
    }
    return ctxRef.current;
  }, []);

  const handleResults = useCallback(
    (results: GestureRecognizerResult) => {
      const canvas = canvasRef.current;

      if (!results.landmarks?.length) {
        if (wasDrawingRef.current && canvas) {
          const ctx = getCanvasContext();
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          wasDrawingRef.current = false;
        }

        resetHands();
        onHandDataRef.current?.({
          left: { ...DEFAULT_HAND_DATA },
          right: { ...DEFAULT_HAND_DATA },
        });
        return;
      }

      const handData = processResults(results, updateHand);

      if (drawLandmarksRef.current) {
        const ctx = getCanvasContext();
        if (ctx) {
          wasDrawingRef.current = true;
          drawHandResults(ctx, results);
        }
      }

      onHandDataRef.current?.(handData);
    },
    [updateHand, resetHands, getCanvasContext]
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
  };
};
