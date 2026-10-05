import { useHandStore } from "@/store/hand-store";
import { attachOverlay } from "@/vision/engine";

export function Stage({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const tracked = useHandStore((state) => state.tracked);

  return (
    <div className="relative mx-auto aspect-video w-full max-w-[calc(52vh*16/9)] overflow-hidden rounded-md border border-black bg-black shadow-[0_0_0_1px_var(--line)]">
      <video
        autoPlay
        className="absolute inset-0 size-full -scale-x-100 object-cover"
        muted
        playsInline
        ref={videoRef}
      />
      {/* Sized and mirrored by the worker to match the video's crop */}
      <canvas
        className="pointer-events-none absolute inset-0 size-full"
        ref={attachOverlay}
      />
      {tracked === 0 && (
        <p className="silkscreen pointer-events-none absolute inset-x-0 bottom-4 text-center text-print/70">
          No hands in view
        </p>
      )}
    </div>
  );
}
