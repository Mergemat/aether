import { FilesetResolver } from "@mediapipe/tasks-vision";

let visionPromise: Promise<WasmFileset> | null = null;

const taskCache = new Map<string, Promise<WasmFileset>>();

interface WasmFileset {
  /** The path to the Wasm loader script. */
  wasmLoaderPath: string;
  /** The path to the Wasm binary. */
  wasmBinaryPath: string;
  /** The optional path to the asset loader script. */
  assetLoaderPath?: string;
  /** The optional path to the assets binary. */
  assetBinaryPath?: string;
}

export const getVision = () => {
  if (!visionPromise) {
    visionPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
  }
  return visionPromise;
};

export function getTask<T>(
  key: string,
  loader: (vision: WasmFileset) => Promise<T>
): Promise<T> {
  if (!taskCache.has(key)) {
    taskCache.set(key, getVision().then(loader));
  }
  return taskCache.get(key) as Promise<T>;
}
