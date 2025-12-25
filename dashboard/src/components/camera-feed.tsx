import type { RefObject } from "react";

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onDetectStart: () => void;
}

export const CameraFeed = ({
  videoRef,
  canvasRef,
  onDetectStart,
}: CameraFeedProps) => (
  <div className="relative aspect-video overflow-hidden rounded-none border border-border bg-black ring-1 ring-foreground/10">
    <video
      autoPlay
      className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      muted
      onLoadedData={onDetectStart}
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
