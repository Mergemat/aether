import { useEffect, useRef, useState } from "react";

export const useWebcam = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      } catch (err) {
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
      console.log("destroy");
      for (const t of streamRef.current?.getTracks() || []) {
        t.stop();
      }
    };
  }, []);

  return { videoRef, error };
};
