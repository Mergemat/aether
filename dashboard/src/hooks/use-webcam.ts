import { useEffect, useRef, useState } from "react";
import perfLogger from "@/lib/utils/logger";

function stopAllTracks(stream: MediaStream | null): void {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

function clearVideoSource(video: HTMLVideoElement | null): void {
  if (video) {
    video.srcObject = null;
  }
}

export const useWebcam = () => {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<Error | null>(null);

  perfLogger.hookInit("useWebcam");

  useEffect(() => {
    let mounted = true;

    const handleSuccess = (stream: MediaStream) => {
      streamRef.current = stream;
      perfLogger.event("useWebcam", "camera access granted");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    const handleAbort = (stream: MediaStream) => {
      perfLogger.event("useWebcam", "unmounted during init - stopping tracks");
      stopAllTracks(stream);
    };

    const init = async () => {
      perfLogger.event("useWebcam", "requesting camera access");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }, // Lower resolution for faster processing
      });

      if (!mounted) {
        handleAbort(stream);
        return;
      }

      handleSuccess(stream);
    };

    // Attach existing stream if we have one (e.g., after strict mode double-mount)
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }

    if (!streamRef.current) {
      init().catch((err) => {
        perfLogger.event("useWebcam", "camera access denied");
        if (mounted) {
          setError(err as Error);
        }
      });
    }

    return () => {
      mounted = false;
      perfLogger.hookCleanup("useWebcam");

      stopAllTracks(streamRef.current);
      clearVideoSource(videoRef.current);
      streamRef.current = null;
    };
  }, []);

  return { videoRef, error };
};
