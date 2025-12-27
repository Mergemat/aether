import {
  DrawingUtils,
  type GestureRecognizerResult,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "react";
import { processHandLandmarks } from "@/lib/utils/hand-processing";
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
  const initRecognizer = useRecognizerStore((state) => state.init);
  const destroyRecognizer = useRecognizerStore((state) => state.destroy);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const updateHand = useHandStore((state) => state.updateHand);

  const drawingUtilsRef = useRef<DrawingUtils | null>(null);

  useEffect(() => {
    initRecognizer();
    console.log("initRecognizer");
    return () => {
      console.log("destroyRecognizer");
      destroyRecognizer();
    };
  }, [initRecognizer, destroyRecognizer]);

  useEffect(() => {
    return () => {
      console.log("clean up everything");
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
    const loop = () => {
      const video = videoRef.current;
      const recognizer = useRecognizerStore.getState().recognizer;

      if (!(video && recognizer) || video.readyState !== 4) {
        requestAnimationFrame(loop);
        return;
      }

      const results = recognizer.recognizeForVideo(video, performance.now());

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
