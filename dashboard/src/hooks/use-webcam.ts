import { useEffect, useRef, useState } from "react";
import perfLogger from "@/lib/utils/logger";

export const useWebcam = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<Error | null>(null);

  perfLogger.hookInit("useWebcam");

  useEffect(() => {
    const init = async () => {
      try {
        perfLogger.event("useWebcam", "requesting camera access");
        const startTime = performance.now();
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        const endTime = performance.now();
        perfLogger.event("useWebcam", "camera access granted", {
          duration: `${(endTime - startTime).toFixed(2)}ms`,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      } catch (err) {
        perfLogger.event("useWebcam", "camera access denied", { error: err });
        setError(err as Error);
      }
    };

    if (videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
    if (!streamRef.current) {
      init();
    }
    return () => {
      perfLogger.hookCleanup("useWebcam");
      for (const t of streamRef.current?.getTracks() || []) {
        t.stop();
      }
    };
  }, []);

  return { videoRef, error };
};
