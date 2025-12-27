import { create } from "zustand";
import perfLogger from "@/lib/utils/logger";

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

  setStatus: (status) => {
    perfLogger.storeUpdate("websocket-store", "setStatus", { status });
    set({ status });
  },
  setError: (error) => {
    perfLogger.storeUpdate("websocket-store", "setError", { error });
    set({ error });
  },
  setConnectedAt: (connectedAt) => {
    perfLogger.storeUpdate("websocket-store", "setConnectedAt", {
      connectedAt,
    });
    set({ connectedAt });
  },
  incrementReconnectAttempts: () =>
    set((state) => {
      const newCount = state.reconnectAttempts + 1;
      perfLogger.storeUpdate("websocket-store", "incrementReconnectAttempts", {
        reconnectAttempts: newCount,
      });
      return { reconnectAttempts: newCount };
    }),
  resetReconnectAttempts: () => {
    perfLogger.storeUpdate("websocket-store", "resetReconnectAttempts");
    set({ reconnectAttempts: 0 });
  },
}));
