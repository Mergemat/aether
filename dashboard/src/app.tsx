import { useGestureRecognition } from "./hooks/use-gesture-recognition";
import { useWebcam } from "./hooks/use-webcam";
import { useHandStore } from "./store/hand-store";

export default function App() {
  const { videoRef, error } = useWebcam();

  const { canvasRef, startDetection } = useGestureRecognition({
    videoRef,
  });

  if (error) {
    return <div>Camera access denied</div>;
  }

  return (
    <>
      <div className="relative aspect-video max-w-2xl bg-black">
        <video
          autoPlay
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          height={720}
          muted
          onLoadedData={startDetection}
          onLoadedMetadata={() => {
            if (videoRef.current && canvasRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
          }}
          playsInline
          ref={videoRef}
          width={1280}
        />
        <canvas
          className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 opacity-60"
          height={720}
          ref={canvasRef}
          width={1280}
        />
      </div>
      <HandGesturePanel hand="left" />
      <HandGesturePanel hand="right" />
    </>
  );
}

interface Props {
  hand: "left" | "right";
}

export const HandGesturePanel = ({ hand }: Props) => {
  const gestures = useHandStore((s) => s[hand]);

  if (!gestures) {
    return null;
  }

  return (
    <div>
      <h3>{hand.toUpperCase()}</h3>

      {Object.entries(gestures.gestureData).map(([gesture, data]) => (
        <div key={gesture}>
          <strong>{gesture}</strong>
          <span> y: {data.y.toFixed(2)}</span>
          <span> rot: {data.rot.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};
