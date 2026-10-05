import { useEffect, useRef, useState } from "react";
import { cameraStream } from "@/vision/engine";

/** Shows the engine's camera stream in a <video> preview */
export const useWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    cameraStream.then(
      (stream) => {
        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      },
      (err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, []);

  return { videoRef, error };
};
