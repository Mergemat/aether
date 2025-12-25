import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { activeGesturesAtom, currentHandDataAtom, mappingsAtom } from "./atoms";
import { AddMappingButton } from "./components/add-mapping-button";
import { CameraFeed } from "./components/camera-feed";
import { Header } from "./components/header";
import { MappingCard } from "./components/mapping-card";
import { SensorDataDisplay } from "./components/sensor-data-display";
import {
  useDetectionState,
  useLiveValues,
  useMappingOperations,
  useMappingsPersistence,
  useWebSocket,
} from "./hooks/use-app-hooks";
import { useGestureRecognition } from "./hooks/use-gesture-recognition";
import type { Mapping } from "./types";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ws = useWebSocket();

  const setActiveGestures = useSetAtom(activeGesturesAtom);
  const setCurrentHandData = useSetAtom(currentHandDataAtom);

  // Subscribe to the base mappings (ids/config), not the high-freq values
  const mappings = useAtomValue(mappingsAtom);
  const { setMappings, calibrate, updateMapping, deleteMapping, addMapping } =
    useMappingOperations();

  useMappingsPersistence(mappings, setMappings);

  const {
    liveValues,
    smoothedValues,
    lastTrigger,
    latestHandDataRef,
    mappingsRef,
  } = useDetectionState(mappings);

  useLiveValues(liveValues);

  const { detect, isReady } = useGestureRecognition({
    videoRef,
    canvasRef,
    onGestures: ({ left: leftGesture, right: rightGesture }) =>
      setActiveGestures((prev) =>
        // only update if the gesture has changed
        leftGesture !== prev.left || rightGesture !== prev.right
          ? { left: leftGesture, right: rightGesture }
          : prev
      ),
    onHandData: useCallback(
      (handData) => {
        latestHandDataRef.current = handData;
        setCurrentHandData(handData);
      },
      [setCurrentHandData, latestHandDataRef]
    ),
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

  const startDetect = () => {
    detect(mappingsRef.current, ws, liveValues, smoothedValues, lastTrigger);
  };

  const handleCalibrate = useCallback(
    (mapping: Mapping, type: "min" | "max") => {
      calibrate(latestHandDataRef, mapping, type);
    },
    [calibrate, latestHandDataRef]
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Header />
      <main className="grid grid-cols-[400px_1fr] gap-8 p-6">
        <div className="space-y-6">
          <CameraFeed
            canvasRef={canvasRef}
            onDetectStart={startDetect}
            videoRef={videoRef}
          />
          {/* SensorDataDisplay should call useAtomValue(currentHandDataAtom) internally */}
          <SensorDataDisplay />
        </div>

        <div className="space-y-3">
          {mappings.map((m) => (
            <MappingCard
              key={m.id}
              mapping={m} // Ensure this is 'mapping', not 'mappingId'
              onCalibrate={handleCalibrate}
              onDelete={deleteMapping}
              onUpdate={updateMapping}
            />
          ))}
          <AddMappingButton
            isDisabled={mappings.length >= 8}
            onClick={addMapping}
          />
        </div>
      </main>
    </div>
  );
}
