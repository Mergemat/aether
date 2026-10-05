/**
 * Main-thread side of the vision pipeline. Importing this module starts the
 * worker (model load) and the camera in parallel, before React renders.
 */
import overlayFont from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2?url";
import { useEngineStatus } from "@/store/engine-status-store";
import { useHandStore } from "@/store/hand-store";
import { useMappingsStore } from "@/store/mappings-store";
import type { FromWorker, ToWorker } from "./protocol";

const WS_URL = "ws://127.0.0.1:8888";

// Re-running this module would start a second worker, camera and socket,
// so reload the page instead of hot-swapping it
import.meta.hot?.dispose(() => location.reload());

// Served from the app itself (see mediapipeAssets in vite.config.ts), so
// startup needs no network and works offline
const asset = (name: string) =>
  new URL(`mediapipe/${name}`, document.baseURI).href;

const worker = new Worker(new URL("./vision.worker.ts", import.meta.url), {
  type: "module",
  name: "vision",
});

const send = (message: ToWorker, transfer: Transferable[] = []) =>
  worker.postMessage(message, transfer);

let frameInFlight = false;

/** Resolves once the gesture recognizer is ready; rejects if it can't load */
export const visionReady = new Promise<void>((resolve, reject) => {
  worker.addEventListener("error", (event) => {
    reject(new Error(event.message || "Vision worker failed to start"));
  });
  worker.addEventListener("message", (event: MessageEvent<FromWorker>) => {
    const message = event.data;
    switch (message.type) {
      case "hands":
        useHandStore.getState().setHands(message.hands, message.tracked);
        break;
      case "status":
        useEngineStatus.setState({
          connected: message.connected,
          fps: message.fps,
        });
        break;
      case "frame-done":
        frameInFlight = false;
        break;
      case "ready":
        resolve();
        break;
      case "error":
        reject(new Error(message.message));
        break;
      default:
        break;
    }
  });
});

send({
  type: "init",
  wasmLoaderPath: asset("vision_wasm_module_internal.js"),
  wasmBinaryPath: asset("vision_wasm_module_internal.wasm"),
  modelAssetPath: asset("gesture_recognizer.task"),
  overlayFontUrl: new URL(overlayFont, document.baseURI).href,
  wsUrl: WS_URL,
  mappings: useMappingsStore.getState().mappings,
});

useMappingsStore.subscribe((state, prev) => {
  if (state.mappings !== prev.mappings) {
    send({ type: "mappings", mappings: state.mappings });
  }
});

/**
 * Fallback for browsers without MediaStreamTrackProcessor: grab each new
 * video frame on the main thread, keeping at most one in flight so frames
 * are dropped rather than queued when the worker falls behind.
 */
function streamFromVideo(stream: MediaStream) {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  video.play().catch(() => undefined);

  const onFrame = () => {
    if (!frameInFlight && video.videoWidth > 0) {
      frameInFlight = true;
      const frame = new VideoFrame(video);
      send({ type: "frame", frame }, [frame]);
    }
    video.requestVideoFrameCallback(onFrame);
  };
  video.requestVideoFrameCallback(onFrame);
}

function streamFrames(stream: MediaStream) {
  const [track] = stream.getVideoTracks();
  if (typeof MediaStreamTrackProcessor === "undefined") {
    streamFromVideo(stream);
    return;
  }
  // Frames go from the capture pipeline straight to the worker, independent
  // of rendering, so detection keeps full rate when the window is hidden
  const { readable } = new MediaStreamTrackProcessor({ track });
  send({ type: "frames", readable }, [readable]);
}

export const cameraStream = navigator.mediaDevices
  .getUserMedia({
    audio: false,
    video: {
      // Hand landmarks don't need more; 16:9 matches the preview box
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 60 },
    },
  })
  .then((stream) => {
    streamFrames(stream);
    return stream;
  });

// Rejections surface through useWebcam; don't also report them as unhandled
cameraStream.catch(() => undefined);

const transferred = new WeakSet<HTMLCanvasElement>();

/** Ref callback for the preview overlay; the worker draws into it directly */
export function attachOverlay(canvas: HTMLCanvasElement | null) {
  if (!canvas || transferred.has(canvas)) {
    return;
  }
  transferred.add(canvas);
  const offscreen = canvas.transferControlToOffscreen();
  send({ type: "overlay", canvas: offscreen }, [offscreen]);

  // Render at the element's real device-pixel size so lines and text stay
  // sharp at any window size
  const observer = new ResizeObserver(([entry]) => {
    const pixelRatio = window.devicePixelRatio;
    const box = entry.devicePixelContentBoxSize?.[0];
    send({
      type: "overlay-size",
      width:
        box?.inlineSize ?? Math.round(entry.contentRect.width * pixelRatio),
      height:
        box?.blockSize ?? Math.round(entry.contentRect.height * pixelRatio),
      pixelRatio,
    });
  });
  try {
    observer.observe(canvas, { box: "device-pixel-content-box" });
  } catch {
    observer.observe(canvas);
  }
}
