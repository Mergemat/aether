import type { BothHandsData, Mapping } from "@/types";

export type ToWorker =
  | {
      type: "init";
      mappings: Mapping[];
      modelAssetPath: string;
      overlayFontUrl: string;
      wasmBinaryPath: string;
      wasmLoaderPath: string;
      wsUrl: string;
    }
  /** Camera frames straight from the capture pipeline (Chromium) */
  | { type: "frames"; readable: ReadableStream<VideoFrame> }
  /** One frame grabbed on the main thread, where frame streams are missing */
  | { type: "frame"; frame: VideoFrame }
  | { type: "overlay"; canvas: OffscreenCanvas }
  /** Overlay size in device pixels, so it renders sharp at any window size */
  | { type: "overlay-size"; height: number; pixelRatio: number; width: number }
  | { type: "mappings"; mappings: Mapping[] };

export type FromWorker =
  | { type: "ready" }
  | { type: "error"; message: string }
  /** `tracked` counts hands in view, with or without a recognized gesture */
  | { type: "hands"; hands: BothHandsData; tracked: number }
  /** Sent when either value changes, checked once a second */
  | { type: "status"; connected: boolean; fps: number }
  /** The worker is free for the next main-thread frame */
  | { type: "frame-done" };
