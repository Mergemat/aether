import { create } from "zustand";

interface EngineStatus {
  /** Whether the OSC bridge's WebSocket is connected */
  connected: boolean;
  /** Camera frames recognized in the last second */
  fps: number;
}

export const useEngineStatus = create<EngineStatus>(() => ({
  connected: false,
  fps: 0,
}));
