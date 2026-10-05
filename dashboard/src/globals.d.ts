// Chromium-only and missing from lib.dom; feature-detected before use
declare class MediaStreamTrackProcessor {
  constructor(init: { maxBufferSize?: number; track: MediaStreamTrack });
  readonly readable: ReadableStream<VideoFrame>;
}

// Exposed by electron/preload.ts; missing when the dashboard runs in a browser
interface Window {
  electronAPI?: { platform: string; version: string };
}
