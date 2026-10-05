/**
 * The whole realtime pipeline runs here, off the main thread: camera frame →
 * gesture recognition → OSC over WebSocket → overlay drawing. The UI only
 * receives the resulting hand state, so React work never delays output.
 */
import {
  GestureRecognizer,
  type GestureRecognizerOptions,
  type GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import { IGNORED_GESTURES } from "@/lib/constants";
import { createMappingOutput } from "@/lib/core/mapping-output";
import { encodeOscPacket } from "@/lib/osc";
import {
  createHandOverlay,
  type HandDetection,
} from "@/lib/overlay/hand-overlay";
import { processHandLandmarks } from "@/lib/utils/hand-processing";
import { WebSocketClient } from "@/services/websocket-client";
import type { BothHandsData, GestureHandData, Hand } from "@/types";
import type { FromWorker, ToWorker } from "./protocol";

const NO_HAND: GestureHandData = { gesture: "None", y: 0, rot: 0 };

let recognizer: GestureRecognizer | null = null;
let client: WebSocketClient | null = null;
let overlay: ReturnType<typeof createHandOverlay> | null = null;
let lastTimestamp = 0;
let framesThisSecond = 0;

const output = createMappingOutput();
let lastPosted: BothHandsData = { left: NO_HAND, right: NO_HAND };
let lastTracked = 0;
let lastStatus: Extract<FromWorker, { type: "status" }> | null = null;

const post = (message: FromWorker) => self.postMessage(message);

async function createRecognizer(
  config: Extract<ToWorker, { type: "init" }>
): Promise<GestureRecognizer> {
  const fileset = {
    wasmLoaderPath: config.wasmLoaderPath,
    wasmBinaryPath: config.wasmBinaryPath,
  };
  const options = (delegate: "GPU" | "CPU"): GestureRecognizerOptions => ({
    baseOptions: { modelAssetPath: config.modelAssetPath, delegate },
    cannedGesturesClassifierOptions: {
      categoryDenylist: [...IGNORED_GESTURES],
    },
    runningMode: "VIDEO",
    minHandDetectionConfidence: 0.9,
    numHands: 2,
  });

  try {
    return await GestureRecognizer.createFromOptions(fileset, options("GPU"));
  } catch (error) {
    console.warn("[vision] GPU delegate unavailable, using CPU", error);
    return GestureRecognizer.createFromOptions(fileset, options("CPU"));
  }
}

/**
 * Every tracked hand (including ones without a recognized gesture) for the
 * overlay, plus per-side gesture data for output and the UI
 */
function readHands(result: GestureRecognizerResult) {
  const hands: BothHandsData = { left: NO_HAND, right: NO_HAND };
  const detections = result.landmarks.map((landmarks, i): HandDetection => {
    const gesture = result.gestures[i]?.[0]?.categoryName ?? "None";
    const handedness = result.handedness[i][0].categoryName;
    const side = handedness.toLowerCase() as Hand;
    if (gesture !== "None") {
      const { y, rot } = processHandLandmarks(landmarks, handedness, gesture);
      hands[side] = { gesture, y, rot };
    }
    return { side, gesture, landmarks };
  });
  return { detections, hands };
}

const sameHand = (a: GestureHandData, b: GestureHandData) =>
  a.gesture === b.gesture && a.y === b.y && a.rot === b.rot;

function processFrame(frame: VideoFrame) {
  if (!recognizer) {
    frame.close();
    return;
  }

  const frameWidth = frame.displayWidth;
  const frameHeight = frame.displayHeight;

  // VIDEO mode needs strictly increasing timestamps
  const timestamp = Math.max(performance.now(), lastTimestamp + 0.001);
  lastTimestamp = timestamp;

  let result: GestureRecognizerResult;
  try {
    result = recognizer.recognizeForVideo(frame, timestamp);
  } finally {
    // Hand the camera buffer back as early as possible
    frame.close();
  }
  framesThisSecond += 1;

  const { detections, hands } = readHands(result);

  // Output first: it's the latency-critical path
  if (client?.isConnected()) {
    const messages = output.build(hands);
    if (messages.length > 0) {
      client.send(encodeOscPacket(messages));
    }
  }

  overlay?.draw(detections, frameWidth, frameHeight);

  const tracked = detections.length;
  if (
    tracked !== lastTracked ||
    !(
      sameHand(hands.left, lastPosted.left) &&
      sameHand(hands.right, lastPosted.right)
    )
  ) {
    lastPosted = hands;
    lastTracked = tracked;
    post({ type: "hands", hands, tracked });
  }
}

async function pump(readable: ReadableStream<VideoFrame>) {
  // The capture pipeline drops stale frames while we're busy, so this
  // always works on the newest one instead of building a backlog
  const reader = readable.getReader();
  for (;;) {
    // biome-ignore lint/performance/noAwaitInLoops: frames must be read in order
    const { value, done } = await reader.read();
    if (done) {
      return;
    }
    try {
      processFrame(value);
    } catch (error) {
      console.error("[vision] Frame failed", error);
    }
  }
}

function reportStatus() {
  const status = {
    type: "status",
    connected: client?.isConnected() ?? false,
    fps: framesThisSecond,
  } as const;
  framesThisSecond = 0;
  if (
    status.connected !== lastStatus?.connected ||
    status.fps !== lastStatus.fps
  ) {
    lastStatus = status;
    post(status);
  }
}

async function loadOverlayFont(url: string) {
  try {
    const face = new FontFace("IBM Plex Mono", `url(${url})`, {
      weight: "500",
    });
    (self as unknown as { fonts: FontFaceSet }).fonts.add(await face.load());
  } catch (error) {
    console.warn("[vision] Overlay font unavailable", error);
  }
}

async function init(message: Extract<ToWorker, { type: "init" }>) {
  output.setMappings(message.mappings);
  loadOverlayFont(message.overlayFontUrl);

  client = new WebSocketClient(message.wsUrl, {
    onOpen: () => output.reset(),
  });
  client.connect();
  setInterval(reportStatus, 1000);

  try {
    recognizer = await createRecognizer(message);
    post({ type: "ready" });
  } catch (error) {
    post({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

self.addEventListener("message", (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  switch (message.type) {
    case "init":
      init(message);
      break;
    case "frames":
      pump(message.readable).catch((error) =>
        console.error("[vision] Frame stream ended", error)
      );
      break;
    case "frame":
      try {
        processFrame(message.frame);
      } catch (error) {
        console.error("[vision] Frame failed", error);
      } finally {
        post({ type: "frame-done" });
      }
      break;
    case "overlay": {
      const ctx = message.canvas.getContext("2d");
      overlay = ctx ? createHandOverlay(ctx) : null;
      break;
    }
    case "overlay-size":
      overlay?.resize(message.width, message.height, message.pixelRatio);
      break;
    case "mappings":
      output.setMappings(message.mappings);
      break;
    default:
      break;
  }
});
