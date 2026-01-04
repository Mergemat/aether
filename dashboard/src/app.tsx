import { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

import logo from "./assets/logo.svg";
import { Mappings } from "./components/mappings";
import { useGestureRecognition } from "./hooks/use-gesture-recognition";
import { useHandDataStreamer } from "./hooks/use-hand-data-streamer";
import { useWebcam } from "./hooks/use-webcam";

function AppInner() {
  const { videoRef, error } = useWebcam();

  const {
    start: startStreamer,
    stop: stopStreamer,
    sendHandData,
  } = useHandDataStreamer({
    wsUrl: "ws://127.0.0.1:8888",
  });

  const { canvasRef, startDetection, stopDetection } = useGestureRecognition({
    videoRef,
    onHandData: (handData) => {
      sendHandData(handData);
    },
  });

  useEffect(() => {
    startStreamer();
    return () => stopStreamer();
  }, [startStreamer, stopStreamer]);

  useEffect(() => {
    return () => stopDetection();
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

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-4">
      <div className="flex justify-center gap-2">
        <img alt="Logo" className="h-8" height={32} src={logo} width={32} />
        <h1 className="font-bold text-3xl tracking-tighter">AETHER</h1>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black shadow-lg">
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
      <div className="mx-auto w-full max-w-3xl">
        <Mappings />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <VisionError error={error} />}
    >
      <Suspense fallback={<VisionLoader />}>
        <AppInner />
      </Suspense>
    </ErrorBoundary>
  );
}

export const VisionLoader = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-background p-8 shadow-2xl backdrop-blur-xl">
    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    <h3 className="font-medium text-white">Loading Vision Models</h3>
    <p className="text-slate-400 text-sm">Downloading WASM binaries...</p>
  </div>
);

export const VisionError = ({ error }: { error: Error }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-background">
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
      <p className="mb-2 font-bold text-red-400">Engine Error</p>
      <p className="text-red-300/80 text-sm">{error.message}</p>
    </div>
  </div>
);
