import { create } from "zustand";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface WebSocketState {
  status: ConnectionStatus;
  error: string | null;
  connectedAt: number | null;
  reconnectAttempts: number;

  setStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  setConnectedAt: (timestamp: number | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  status: "disconnected",
  error: null,
  connectedAt: null,
  reconnectAttempts: 0,

  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setConnectedAt: (connectedAt) => set({ connectedAt }),
  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
}));
