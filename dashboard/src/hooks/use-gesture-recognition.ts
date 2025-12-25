import {
  DrawingUtils,
  FilesetResolver,
  GestureRecognizer,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { isReadyAtom } from "@/atoms";
import type { HandData, Mapping } from "@/types";
import { clamp, SMOOTHING } from "@/utils";

interface UseGestureRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;

  canvasRef: React.RefObject<HTMLCanvasElement | null>;

  onGestures: (gestures: { left: string; right: string }) => void;

  onHandData: (handData: {
    left: HandData | null;

    right: HandData | null;
  }) => void;
}

export const useGestureRecognition = ({
  videoRef,
  canvasRef,
  onGestures,
  onHandData,
}: UseGestureRecognitionProps) => {
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  const lastGestures = useRef({ left: "", right: "" });
  const [isReady, setIsReady] = useAtom(isReadyAtom);

  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      recognizerRef.current = await GestureRecognizer.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
        }
      );
      setIsReady(true);
    };
    init();
    return () => {
      recognizerRef.current?.close();
      cancelAnimationFrame(requestRef.current);
    };
  }, [setIsReady]);

  const detect = useCallback(
    (
      mappings: Mapping[],
      ws: React.RefObject<WebSocket | null>,
      liveValues: React.RefObject<Record<string, number>>,
      smoothedValues: React.RefObject<Record<string, number>>,
      lastTrigger: React.RefObject<Record<string, number>>
    ) => {
      const video = videoRef.current;
      const rec = recognizerRef.current;
      if (!(video && rec) || video.readyState !== 4) {
        requestRef.current = requestAnimationFrame(() =>
          detect(mappings, ws, liveValues, smoothedValues, lastTrigger)
        );
        return;
      }

      const res = rec.recognizeForVideo(video, performance.now());
      const ctx = canvasRef.current?.getContext("2d", { alpha: false });

      // Drawing optimization: only draw if landmarks exist
      if (ctx && canvasRef.current && res.landmarks) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        const drawingUtils = new DrawingUtils(ctx);
        for (const lm of res.landmarks) {
          drawingUtils.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS);
          drawingUtils.drawLandmarks(lm);
        }
      }

      const currentGestures = { left: "None", right: "None" };
      const currentHandData: { left: HandData | null; right: HandData | null } =
        { left: null, right: null };

      if (res.landmarks?.length) {
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <idgaf for now>
        res.landmarks.forEach((lm, i) => {
          const gesture = res.gestures?.[i]?.[0]?.categoryName || "None";
          const hand = res.handedness[i][0].categoryName.toLowerCase() as
            | "left"
            | "right";

          console.log(hand, gesture);

          // Math optimizations
          const y = 1 - lm[9].y;
          const rot = Math.atan2(
            lm[17].y - lm[5].y,
            hand === "left" ? lm[17].x - lm[5].x : lm[5].x - lm[17].x
          );

          currentGestures[hand] = gesture;
          currentHandData[hand] = { y, rot };

          // Optimized Mapping Loop
          // biome-ignore lint/style/useForOf: <idgaf for now>
          for (let j = 0; j < mappings.length; j++) {
            const m = mappings[j];
            if (!m.enabled || m.hand !== hand || m.gesture !== gesture) {
              continue;
            }

            if (m.mode === "trigger") {
              const now = performance.now();
              if ((lastTrigger.current[m.id] || 0) + 400 > now) {
                continue;
              }

              lastTrigger.current[m.id] = now;
              ws.current?.send(
                JSON.stringify({ address: m.address, value: 1 })
              );
            } else {
              const inputVal = m.mode === "knob" ? rot : y;
              const targetVal = clamp(
                (inputVal - m.range.min) / (m.range.max - m.range.min || 0.001),
                0,
                1
              );

              const prev = smoothedValues.current[m.id] ?? targetVal;
              const smoothVal = targetVal * SMOOTHING + prev * (1 - SMOOTHING);

              smoothedValues.current[m.id] = smoothVal;
              if (Math.abs(prev - smoothVal) > 0.001) {
                // Threshold to reduce WS traffic
                liveValues.current[m.id] = smoothVal;
                ws.current?.send(
                  JSON.stringify({
                    address: m.address,
                    value: Number(smoothVal.toFixed(3)),
                  })
                );
              }
            }
          }
        });
      }

      // Only update state if gestures changed to prevent heavy React reconciliation
      if (
        currentGestures.left !== lastGestures.current.left ||
        currentGestures.right !== lastGestures.current.right
      ) {
        lastGestures.current = currentGestures;
        onGestures(currentGestures);
      }

      onHandData(currentHandData);
      requestRef.current = requestAnimationFrame(() =>
        detect(mappings, ws, liveValues, smoothedValues, lastTrigger)
      );
    },
    [videoRef, canvasRef, onGestures, onHandData]
  );

  return { recognizerRef, detect, isReady };
};
