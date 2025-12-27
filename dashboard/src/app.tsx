import { useEffect } from "react";

import { Mappings } from "./components/mappings";
import { Spinner } from "./components/ui/spinner";
import { useGestureRecognition } from "./hooks/use-gesture-recognition";
import { useHandDataStreamer } from "./hooks/use-hand-data-streamer";
import { useWebcam } from "./hooks/use-webcam";
import perfLogger from "./lib/utils/logger";

export default function App() {
  perfLogger.componentRender("App");

  const { videoRef, error } = useWebcam();

  const { start: startStreamer, sendHandData } = useHandDataStreamer({
    wsUrl: "ws://127.0.0.1:8888",
  });

  useEffect(() => {
    perfLogger.effect("App", 1, ["startStreamer"]);
    startStreamer();
  }, [startStreamer]);

  const {
    canvasRef,
    startDetection,
    isLoading,
    loadingProgress,
    error: recognizerError,
  } = useGestureRecognition({
    videoRef,
    // drawLandmarks: false,
    onHandData: (handData) => {
      sendHandData(handData);
    },
  });

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="font-medium text-lg">Camera access denied</p>
          <p className="text-muted-foreground text-sm">
            Please enable camera access to use this app
          </p>
        </div>
      </div>
    );
  }

  if (recognizerError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="font-medium text-lg">
            Failed to initialize gesture recognizer
          </p>
          <p className="text-muted-foreground text-sm">{recognizerError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
            <Spinner size="lg" />
            <p className="text-muted-foreground text-sm">{loadingProgress}</p>
          </div>
        )}
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
