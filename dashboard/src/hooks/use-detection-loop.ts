import type {
  GestureRecognizer,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef } from "react";

interface UseDetectionLoopProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  recognizer: GestureRecognizer | null;
  onResults: (results: GestureRecognizerResult) => void;
}

interface UseDetectionLoopReturn {
  start: () => void;
  stop: () => void;
  isRunning: boolean;
}

export function useDetectionLoop({
  videoRef,
  recognizer,
  onResults,
}: UseDetectionLoopProps): UseDetectionLoopReturn {
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const onResultsRef = useRef(onResults);

  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  const stop = useCallback(() => {
    isRunningRef.current = false;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const startRequestedRef = useRef(false);

  const start = useCallback(() => {
    startRequestedRef.current = true;

    if (isRunningRef.current) {
      return;
    }

    if (!recognizer) {
      return;
    }

    isRunningRef.current = true;

    const loop = () => {
      if (!isRunningRef.current) {
        return;
      }

      const video = videoRef.current;
      const isVideoReady = video && recognizer && video.readyState === 4;

      if (!isVideoReady) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const results = recognizer.recognizeForVideo(video, performance.now());
      onResultsRef.current(results);

      if (isRunningRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    loop();
  }, [videoRef, recognizer]);

  useEffect(() => {
    if (recognizer && startRequestedRef.current && !isRunningRef.current) {
      start();
    }
  }, [recognizer, start]);

  useEffect(() => {
    return () => {
      isRunningRef.current = false;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, []);

  return {
    start,
    stop,
    isRunning: isRunningRef.current,
  };
}

// useless commit to trigger the build
// another useless commit to trigger the build
