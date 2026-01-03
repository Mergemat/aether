import { useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    let mounted = true;

    const handleSuccess = (stream: MediaStream) => {
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    const handleAbort = (stream: MediaStream) => {
      stopAllTracks(stream);
    };

    const init = async () => {
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
        if (mounted) {
          setError(err as Error);
        }
      });
    }

    return () => {
      mounted = false;

      stopAllTracks(streamRef.current);
      clearVideoSource(videoRef.current);
      streamRef.current = null;
    };
  }, []);

  return { videoRef, error };
};
