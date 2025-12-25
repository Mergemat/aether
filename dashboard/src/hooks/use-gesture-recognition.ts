import {
  DrawingUtils,
  FilesetResolver,
  GestureRecognizer,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { isReadyAtom, mappingsAtom } from "@/atoms";
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
  setLiveValues: (
    value:
      | Record<string, number>
      | ((prev: Record<string, number>) => Record<string, number>)
  ) => void;
}

const processTrigger = (
  m: Mapping,
  ws: WebSocket | null,
  lastTrigger: Record<string, number>
) => {
  const now = performance.now();
  if ((lastTrigger[m.id] || 0) + 400 > now) {
    return false;
  }
  lastTrigger[m.id] = now;
  ws?.send(JSON.stringify({ address: m.address, value: 1 }));
  return true;
};

const processFaderOrKnob = (
  m: Mapping,
  inputVal: number,
  ws: WebSocket | null,
  liveValues: Record<string, number>,
  smoothedValues: Record<string, number>
) => {
  console.log("processFaderOrKnob", m.address);
  const targetVal = clamp(
    (inputVal - m.range.min) / (m.range.max - m.range.min || 0.001),
    0,
    1
  );

  const prev = smoothedValues[m.id] ?? targetVal;
  const smoothVal = targetVal * SMOOTHING + prev * (1 - SMOOTHING);

  smoothedValues[m.id] = smoothVal;

  if (Math.abs(prev - smoothVal) > 0.001) {
    liveValues[m.id] = smoothVal;
    ws?.send(
      JSON.stringify({
        address: m.address,
        value: Number(smoothVal.toFixed(3)),
      })
    );
  }
};

const processMapping = (
  m: Mapping,
  hand: "left" | "right",
  gesture: string,
  y: number,
  rot: number,
  ws: WebSocket | null,
  liveValues: Record<string, number>,
  smoothedValues: Record<string, number>,
  lastTrigger: Record<string, number>
) => {
  if (!m.enabled || m.hand !== hand || m.gesture !== gesture) {
    return;
  }

  if (m.mode === "trigger") {
    processTrigger(m, ws, lastTrigger);
  } else {
    const inputVal = m.mode === "knob" ? rot : y;
    processFaderOrKnob(m, inputVal, ws, liveValues, smoothedValues);
  }
};

const processHandLandmarks = (
  lm: Array<{ x: number; y: number; z: number }>,
  i: number,
  res: {
    gestures?: Array<Array<{ categoryName: string; score: number }>>;
    handedness: Array<Array<{ categoryName: string; score: number }>>;
  },
  currentGestures: { left: string; right: string },
  currentHandData: { left: HandData | null; right: HandData | null },
  mappings: Mapping[],
  ws: WebSocket | null,
  liveValues: Record<string, number>,
  smoothedValues: Record<string, number>,
  lastTrigger: Record<string, number>
) => {
  const gesture = res.gestures?.[i]?.[0]?.categoryName || "None";
  const hand = res.handedness[i][0].categoryName.toLowerCase() as
    | "left"
    | "right";

  const y = 1 - lm[9].y;
  const dx = lm[17].x - lm[5].x;
  const dy = lm[17].y - lm[5].y;
  const rot = Math.atan2(dy, hand === "left" ? dx : -dx);

  currentGestures[hand] = gesture;
  currentHandData[hand] = { y, rot };

  for (const m of mappings) {
    processMapping(
      m,
      hand,
      gesture,
      y,
      rot,
      ws,
      liveValues,
      smoothedValues,
      lastTrigger
    );
  }
};

export const useGestureRecognition = ({
  videoRef,
  canvasRef,
  onGestures,
  onHandData,
  setLiveValues,
}: UseGestureRecognitionProps) => {
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const [isReady, setIsReady] = useAtom(isReadyAtom);
  const mappings = useAtomValue(mappingsAtom);
  console.log("mappings", mappings);

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
    };
  }, [setIsReady]);

  const detect = (
    ws: WebSocket | null,
    smoothedValues: Record<string, number>,
    lastTrigger: Record<string, number>,
    lastGestures: { left: string; right: string }
  ) => {
    const liveValues: Record<string, number> = {};

    const loop = () => {
      const video = videoRef.current;
      const rec = recognizerRef.current;
      if (!(video && rec) || video.readyState !== 4) {
        requestAnimationFrame(loop);
        return;
      }

      const res = rec.recognizeForVideo(video, performance.now());
      const ctx = canvasRef.current?.getContext("2d", { alpha: false });

      if (ctx && canvasRef.current && res.landmarks) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        const drawingUtils = new DrawingUtils(ctx);
        for (const lm of res.landmarks) {
          drawingUtils.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS);
          drawingUtils.drawLandmarks(lm);
        }
      }

      const currentGestures = { left: "None", right: "None" };
      const currentHandData: {
        left: HandData | null;
        right: HandData | null;
      } = { left: null, right: null };

      if (res.landmarks?.length) {
        for (let i = 0; i < res.landmarks.length; i++) {
          processHandLandmarks(
            res.landmarks[i],
            i,
            res,
            currentGestures,
            currentHandData,
            mappings,
            ws,
            liveValues,
            smoothedValues,
            lastTrigger
          );
        }
      }

      if (
        currentGestures.left !== lastGestures.left ||
        currentGestures.right !== lastGestures.right
      ) {
        lastGestures.left = currentGestures.left;
        lastGestures.right = currentGestures.right;
        onGestures(currentGestures);
      }

      onHandData(currentHandData);
      setLiveValues(liveValues);
      requestAnimationFrame(loop);
    };

    loop();
  };

  return { recognizerRef, detect, isReady };
};
