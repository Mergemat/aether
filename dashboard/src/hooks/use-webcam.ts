import { useEffect, useRef, useState } from "react";

export const useWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError(err as Error);
      }
    };

    init();
    return () => {
      for (const t of stream?.getTracks() || []) {
        t.stop();
      }
    };
  }, []);

  return { videoRef, error };
};
