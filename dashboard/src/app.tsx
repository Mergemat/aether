import { useEffect } from "react";

import logo from "./assets/logo.svg";
import { Mappings } from "./components/mappings";
import { Spinner } from "./components/ui/spinner";
import { useGestureRecognition } from "./hooks/use-gesture-recognition";
import { useHandDataStreamer } from "./hooks/use-hand-data-streamer";
import { useWebcam } from "./hooks/use-webcam";
import perfLogger from "./lib/utils/logger";

export default function App() {
  perfLogger.componentRender("App");

  const { videoRef, error } = useWebcam();

  const {
    start: startStreamer,
    stop: stopStreamer,
    sendHandData,
  } = useHandDataStreamer({
    wsUrl: "ws://127.0.0.1:8888",
  });

  const {
    canvasRef,
    startDetection,
    stopDetection,
    isLoading,
    loadingProgress,
    error: recognizerError,
  } = useGestureRecognition({
    videoRef,
    onHandData: (handData) => {
      sendHandData(handData);
    },
  });

  useEffect(() => {
    perfLogger.effect("App", 1, ["startStreamer"]);
    startStreamer();

    return () => {
      perfLogger.effectCleanup("App", 1);
      stopStreamer();
    };
  }, [startStreamer, stopStreamer]);

  useEffect(() => {
    return () => {
      perfLogger.effectCleanup("App", 2);
      stopDetection();
    };
  }, [stopDetection]);

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
    <div className="flex flex-1 flex-col gap-4 px-4 pt-4">
      <div className="flex justify-center gap-2">
        <img alt="Logo" className="h-8" src={logo} />
        <h1 className="font-bold text-2xl tracking-tighter">AETHER</h1>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-lg">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80">
              <Spinner className="size-8" />
              <p className="text-muted-foreground text-sm">{loadingProgress}</p>
            </div>
          )}
          <video
            autoPlay
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover opacity-70"
            height={480}
            muted
            onLoadedData={startDetection}
            playsInline
            ref={videoRef}
            width={640}
          />
          <canvas
            className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100"
            height={480}
            ref={canvasRef}
            width={640}
          />
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl">
        <Mappings />
      </div>
    </div>
  );
}
