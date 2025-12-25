import type { RefObject } from "react";
import { useDetectionState, useWebSocket } from "@/hooks/use-app-hooks";

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  detect: (
    ws: WebSocket | null,
    smoothedValues: Record<string, number>,
    lastTrigger: Record<string, number>,
    lastGestures: { left: string; right: string }
  ) => void;
}

export const CameraFeed = ({
  videoRef,
  canvasRef,
  detect,
}: CameraFeedProps) => {
  const ws = useWebSocket();

  const { smoothedValues, lastTrigger } = useDetectionState();

  const startDetect = () => {
    detect(ws.current, smoothedValues.current, lastTrigger.current, {
      left: "None",
      right: "None",
    });
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-none border border-border bg-black ring-1 ring-foreground/10">
      <video
        autoPlay
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        muted
        onLoadedData={startDetect}
        onLoadedMetadata={() => {
          if (!(videoRef.current && canvasRef.current)) {
            return;
          }
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }}
        playsInline
        ref={videoRef}
      />
      <canvas
        className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover opacity-60"
        ref={canvasRef}
      />
    </div>
  );
};
