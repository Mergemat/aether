import { FilesetResolver } from "@mediapipe/tasks-vision";

type WasmFileset = Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;

let visionPromise: Promise<WasmFileset> | null = null;

const taskCache = new Map<string, Promise<unknown>>();

export const getVision = () => {
  if (!visionPromise) {
    visionPromise = FilesetResolver.forVisionTasks(
      `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${__MEDIAPIPE_VERSION__}/wasm`
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
