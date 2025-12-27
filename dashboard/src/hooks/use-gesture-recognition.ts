import {
  DrawingUtils,
  type GestureRecognizerResult,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "react";
import { processHandLandmarks } from "@/lib/utils/hand-processing";
import { useHandStore } from "@/store/hand-store";
import { useRecognizerStore } from "@/store/recognizer";

interface UseGestureRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const useGestureRecognition = ({
  videoRef,
}: UseGestureRecognitionProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lastGesturesRef = useRef({ left: "None", right: "None" });

  const initRecognizer = useRecognizerStore((state) => state.init);
  const destroyRecognizer = useRecognizerStore((state) => state.destroy);
  const updateHand = useHandStore((state) => state.updateHand);

  const drawingUtilsRef = useRef<DrawingUtils | null>(null);

  useEffect(() => {
    initRecognizer();
    return () => destroyRecognizer();
  }, [initRecognizer, destroyRecognizer]);

  const drawLandmarks = (results: GestureRecognizerResult) => {
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

      const currentGestures = { left: "None", right: "None" };

      if (results.landmarks?.length) {
        results.landmarks.forEach((landmarks, i) => {
          const gesture = results.gestures?.[i]?.[0]?.categoryName || "None";
          const handedness = results.handedness[i][0].categoryName;
          const side = handedness.toLowerCase() as "left" | "right";

          if (gesture === "None") {
            return;
          }

          console.clear();
          console.log(gesture);
          const rawData = processHandLandmarks(landmarks, handedness);
          updateHand(side, gesture, rawData);
        });
      }
      if (
        currentGestures.left !== lastGesturesRef.current.left ||
        currentGestures.right !== lastGesturesRef.current.right
      ) {
        lastGesturesRef.current = currentGestures;
      }

      drawLandmarks(results);

      requestAnimationFrame(loop);
    };

    loop();
  };

  return { canvasRef, startDetection };
};
