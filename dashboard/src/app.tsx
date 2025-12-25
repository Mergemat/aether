import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  activeGesturesAtom,
  currentHandDataAtom,
  liveValuesAtom,
  mappingsAtom,
} from "./atoms";
import { AddMappingButton } from "./components/add-mapping-button";
import { CameraFeed } from "./components/camera-feed";
import { Header } from "./components/header";
import { MappingCard } from "./components/mapping-card";
import { SensorDataDisplay } from "./components/sensor-data-display";
import { useMappingOperations } from "./hooks/use-app-hooks";
import { useGestureRecognition } from "./hooks/use-gesture-recognition";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const setActiveGestures = useSetAtom(activeGesturesAtom);
  const setCurrentHandData = useSetAtom(currentHandDataAtom);
  const setLiveValues = useSetAtom(liveValuesAtom);

  const { detect, isReady } = useGestureRecognition({
    videoRef,
    canvasRef,
    onGestures: ({ left: leftGesture, right: rightGesture }) =>
      setActiveGestures((prev) =>
        leftGesture !== prev.left || rightGesture !== prev.right
          ? { left: leftGesture, right: rightGesture }
          : prev
      ),
    onHandData: (handData) => {
      setCurrentHandData((prev) => {
        if (prev.left === handData.left && prev.right === handData.right) {
          return prev;
        }
        return handData;
      });
    },
    setLiveValues,
  });

  useEffect(() => {
    if (!isReady) {
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 1280, height: 720 },
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
  }, [isReady]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Header />
      <main className="grid grid-cols-[400px_1fr] gap-8 p-6">
        <div className="space-y-6">
          <CameraFeed
            canvasRef={canvasRef}
            detect={detect}
            videoRef={videoRef}
          />
          <SensorDataDisplay />
        </div>
        <Mappings />
      </main>
    </div>
  );
}

function Mappings() {
  const { addMapping } = useMappingOperations();

  const mappings = useAtomValue(mappingsAtom);

  // const handleCalibrate = (mapping: Mapping, type: "min" | "max") => {
  //   calibrate(currentHandData, mapping, type);
  // };

  return (
    <div className="space-y-3">
      {mappings.map((m) => (
        <MappingCard key={m.id} mapping={m} />
      ))}
      <AddMappingButton
        isDisabled={mappings.length >= 8}
        onClick={addMapping}
      />
    </div>
  );
}
