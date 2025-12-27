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

export const useGestureRecognition = ({
  videoRef,
  drawLandmarks = true,
  onHandData,
}: UseGestureRecognitionProps) => {
  perfLogger.hookInit("useGestureRecognition", { drawLandmarks });

  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] =
    useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<GestureRecognizer | null>(null);

  const updateHand = useHandStore((state) => state.updateHand);

  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const initRecognizer = async () => {
      perfLogger.event("useGestureRecognition", "lazy init started");
      setLoadingProgress("Loading MediaPipe WASM...");

      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (!mounted) {
          return;
        }

        setLoadingProgress("Loading gesture recognizer model...");

        const instance = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        });

        if (!mounted) {
          return;
        }

        recognizerRef.current = instance;
        setIsLoading(false);
        perfLogger.event("useGestureRecognition", "lazy init complete");
      } catch (err) {
        perfLogger.event("useGestureRecognition", "lazy init failed", {
          error: err,
        });
        setError(
          err instanceof Error ? err.message : "Failed to initialize recognizer"
        );
        setIsLoading(false);
      }
    };

    initRecognizer();

    return () => {
      mounted = false;
      if (recognizerRef.current) {
        recognizerRef.current.close();
        recognizerRef.current = null;
      }
    };
  }, []);

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
      const recognizer = recognizerRef.current;

      if (!(video && recognizer) || video.readyState !== 4) {
        requestAnimationFrame(loop);
        return;
      }

      frameCountRef.current++;

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

  return { canvasRef, startDetection, isLoading, loadingProgress, error };
};
