import type {
  GestureRecognizer,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef } from "react";
import perfLogger from "@/lib/utils/logger";

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
    perfLogger.event("useDetectionLoop", "stop called");
    isRunningRef.current = false;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Track if start was requested (to auto-start when recognizer loads)
  const startRequestedRef = useRef(false);

  const start = useCallback(() => {
    perfLogger.event("useDetectionLoop", "start called");
    startRequestedRef.current = true;

    if (isRunningRef.current) {
      perfLogger.event("useDetectionLoop", "start skipped - already running");
      return;
    }

    // Can't start without recognizer - will auto-start when it loads
    if (!recognizer) {
      perfLogger.event(
        "useDetectionLoop",
        "start deferred - recognizer not ready"
      );
      return;
    }

    isRunningRef.current = true;

    const loop = () => {
      if (!isRunningRef.current) {
        perfLogger.event("useDetectionLoop", "loop stopped - not running");
        return;
      }

      const video = videoRef.current;
      const isVideoReady = video && recognizer && video.readyState === 4;

      if (!isVideoReady) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // No FPS throttling - run as fast as possible for minimal latency
      const results = recognizer.recognizeForVideo(video, performance.now());
      onResultsRef.current(results);

      if (isRunningRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    loop();
  }, [videoRef, recognizer]);

  // Auto-start when recognizer becomes available (if start was previously requested)
  useEffect(() => {
    if (recognizer && startRequestedRef.current && !isRunningRef.current) {
      perfLogger.event(
        "useDetectionLoop",
        "auto-starting - recognizer now ready"
      );
      start();
    }
  }, [recognizer, start]);

  useEffect(() => {
    return () => {
      perfLogger.hookCleanup("useDetectionLoop");
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
