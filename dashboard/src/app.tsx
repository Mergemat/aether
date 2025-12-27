import { useEffect } from "react";

import { Mappings } from "./components/mappings";
import { useGestureRecognition } from "./hooks/use-gesture-recognition";
import { useHandDataStreamer } from "./hooks/use-hand-data-streamer";
import { useWebcam } from "./hooks/use-webcam";
import { useHandStore } from "./store/hand-store";
import { useMappingsStore } from "./store/mappings-store";

export default function App() {
  const { videoRef, error } = useWebcam();

  const mappings = useMappingsStore((state) => state.mappings);

  const { start: startStreamer, sendHandData } = useHandDataStreamer({
    wsUrl: "ws://127.0.0.1:8888",
  });

  useEffect(() => {
    startStreamer();
  }, [startStreamer]);

  const { canvasRef, startDetection } = useGestureRecognition({
    videoRef,
    // drawLandmarks: false,
    onHandData: (handData) => {
      sendHandData(handData, mappings);
    },
  });

  if (error) {
    return <div>Camera access denied</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full bg-black">
        <video
          autoPlay
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          height={720}
          muted
          onLoadedData={startDetection}
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
      <Mappings />
    </div>
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
          <span> y: {data.y}</span>
          <span> rot: {data.rot.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
};
