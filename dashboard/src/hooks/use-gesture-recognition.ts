import {
  DrawingUtils,
  type GestureRecognizerResult,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "react";
import { processHandLandmarks } from "@/lib/utils/hand-processing";
import perfLogger from "@/lib/utils/logger";
import { useHandStore } from "@/store/hand-store";
import { useRecognizerStore } from "@/store/recognizer";

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

export const useGestureRecognition = ({
  videoRef,
  drawLandmarks = true,
  onHandData,
}: UseGestureRecognitionProps) => {
  perfLogger.hookInit("useGestureRecognition", { drawLandmarks });

  const initRecognizer = useRecognizerStore((state) => state.init);
  const destroyRecognizer = useRecognizerStore((state) => state.destroy);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateHand = useHandStore((state) => state.updateHand);

  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    perfLogger.effect("useGestureRecognition", 1, [
      "initRecognizer",
      "destroyRecognizer",
    ]);
    initRecognizer();
    perfLogger.event("useGestureRecognition", "initRecognizer called");
    return () => {
      perfLogger.effectCleanup("useGestureRecognition", 1);
      perfLogger.event("useGestureRecognition", "destroyRecognizer called");
      destroyRecognizer();
    };
  }, [initRecognizer, destroyRecognizer]);

  useEffect(() => {
    perfLogger.effect("useGestureRecognition", 2, ["destroyRecognizer"]);
    return () => {
      perfLogger.effectCleanup("useGestureRecognition", 2);
      perfLogger.event("useGestureRecognition", "cleanup");
      destroyRecognizer();
      drawingUtilsRef.current = null;
      canvasRef.current = null;
    };
  }, [destroyRecognizer]);

  const drawLandmarksOnCanvas = (results: GestureRecognizerResult) => {
    const canvas = canvasRef.current;

    const ctx = canvas?.getContext("2d", { alpha: true });

    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (results.landmarks) {
        if (!drawingUtilsRef.current && ctx) {
          drawingUtilsRef.current = new DrawingUtils(ctx);
        }
        for (const landmarks of results.landmarks) {
          drawingUtilsRef.current?.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS
          );
          drawingUtilsRef.current?.drawLandmarks(landmarks);
        }
      }
    }
  };

  const startDetection = () => {
    perfLogger.event("useGestureRecognition", "startDetection called");
    const loop = () => {
      const video = videoRef.current;
      const recognizer = useRecognizerStore.getState().recognizer;

      if (!(video && recognizer) || video.readyState !== 4) {
        requestAnimationFrame(loop);
        return;
      }

      frameCountRef.current++;
      const startTime = performance.now();

      const results = recognizer.recognizeForVideo(video, performance.now());

      const processingTime = performance.now() - startTime;

      if (results.landmarks?.length) {
        const handData = {
          left: { gesture: "None", y: 0, rot: 0 },
          right: { gesture: "None", y: 0, rot: 0 },
        };

        results.landmarks.forEach((landmarks, i) => {
          const gesture = results.gestures?.[i]?.[0]?.categoryName || "None";
          const handedness = results.handedness[i][0].categoryName;
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
        });
        onHandData?.(handData);
      }

      // perfLogger.gestureLoop(frameCountRef.current, processingTime);

      if (drawLandmarks) {
        setTimeout(() => {
          drawLandmarksOnCanvas(results);
        }, 0);
      }

      requestAnimationFrame(loop);
    };

    loop();
  };

  return { canvasRef, startDetection };
};
