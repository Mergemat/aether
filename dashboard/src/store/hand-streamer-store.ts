import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import perfLogger from "@/lib/utils/logger";
import { WebSocketClient } from "@/services/websocket-client";
import type { GestureHandData, Mapping } from "@/types";

type ConnectionStatus = "disconnected" | "connected" | "error";

interface HandDataMessage {
  address: string;
  value: number;
}

interface HandStreamerState {
  client: WebSocketClient | null;
  status: ConnectionStatus;
  isStreaming: boolean;
  lastSentValues: Map<string, { value: number; switchState?: boolean }>;
}

interface HandStreamerActions {
  start: (wsUrl: string, onStatusChange?: (status: ConnectionStatus) => void) => void;
  stop: () => void;
  sendHandData: (
    handData: { left: GestureHandData; right: GestureHandData },
    mappings: Mapping[],
    valueThreshold?: number
  ) => void;
  cleanupStaleEntries: (validAddresses: Set<string>) => void;
}

type HandStreamerStore = HandStreamerState & HandStreamerActions;

export const useHandStreamerStore = create<HandStreamerStore>()(
  subscribeWithSelector((set, get) => ({
    client: null,
    status: "disconnected",
    isStreaming: false,
    lastSentValues: new Map(),

    start: (wsUrl, onStatusChange) => {
      const state = get();
      if (state.isStreaming) {
        perfLogger.event("hand-streamer-store", "start skipped - already streaming");
        return;
      }

      perfLogger.event("hand-streamer-store | start called", { url: wsUrl });

      const client = new WebSocketClient(
        { url: wsUrl },
        {
          onOpen: () => {
            perfLogger.websocket("connected", { url: wsUrl });
            set({ status: "connected", lastSentValues: new Map() });
            onStatusChange?.("connected");
          },
          onClose: () => {
            perfLogger.websocket("disconnected", { url: wsUrl });
            set({ status: "disconnected" });
            onStatusChange?.("disconnected");
          },
          onError: () => {
            perfLogger.websocket("error", { url: wsUrl });
            set({ status: "error" });
            onStatusChange?.("error");
          },
        }
      );

      client.connect();
      set({ client, isStreaming: true });
    },

    stop: () => {
      perfLogger.event("hand-streamer-store", "stop called");
      const { client } = get();

      if (client) {
        client.disconnect();
      }

      set({
        client: null,
        isStreaming: false,
        lastSentValues: new Map(),
      });
    },

    sendHandData: (handData, mappings, valueThreshold = 0.001) => {
      const { client, lastSentValues } = get();

      if (!client) {
        perfLogger.event("hand-streamer-store", "sendHandData skipped - no client");
        return;
      }

      if (!client.isConnected()) {
        perfLogger.event("hand-streamer-store", "sendHandData skipped - not connected");
        return;
      }

      const messages = buildMessages(handData, mappings, lastSentValues, valueThreshold);

      if (messages.length === 0) {
        return;
      }

      client.sendOscBinary(messages);
    },

    cleanupStaleEntries: (validAddresses) => {
      const { lastSentValues } = get();
      let hasChanges = false;

      for (const key of lastSentValues.keys()) {
        if (!validAddresses.has(key)) {
          lastSentValues.delete(key);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        set({ lastSentValues: new Map(lastSentValues) });
      }
    },
  }))
);

function buildMessageForMapping(
  mapping: Mapping,
  data: GestureHandData,
  lastSentValues: Map<string, { value: number; switchState?: boolean }>,
  valueThreshold: number
): HandDataMessage | null {
  const gestureMatched = data.gesture === mapping.gesture;
  const lastEntry = lastSentValues.get(mapping.address);

  // SWITCH MODE: toggle on gesture activation (rising edge)
  if (mapping.mode === "switch") {
    const wasActive = lastEntry?.value === 1;

    // Rising edge: gesture just became active → toggle
    if (gestureMatched && !wasActive) {
      const newSwitchState = !(lastEntry?.switchState ?? false);
      lastSentValues.set(mapping.address, { value: 1, switchState: newSwitchState });
      return { address: mapping.address, value: newSwitchState ? 1 : 0 };
    }

    // Falling edge: gesture deactivated → update tracking only
    if (!gestureMatched && wasActive) {
      lastSentValues.set(mapping.address, {
        value: 0,
        switchState: lastEntry?.switchState ?? false,
      });
    }

    return null;
  }

  // TRIGGER MODE: send 1 when gesture matches, 0 otherwise
  if (mapping.mode === "trigger") {
    const value = gestureMatched ? 1 : 0;
    if (lastEntry?.value === value) {
      return null;
    }
    lastSentValues.set(mapping.address, { value });
    return { address: mapping.address, value };
  }

  // FADER/KNOB MODES: only process when gesture matches
  if (!gestureMatched) {
    return null;
  }

  const value = mapping.mode === "fader" ? data.y : data.rot;
  const hasSignificantChange =
    lastEntry?.value === undefined || Math.abs(value - lastEntry.value) >= valueThreshold;

  if (!hasSignificantChange) {
    return null;
  }

  lastSentValues.set(mapping.address, { value });
  return { address: mapping.address, value };
}

function buildMessages(
  handData: { left: GestureHandData; right: GestureHandData },
  mappings: Mapping[],
  lastSentValues: Map<string, { value: number; switchState?: boolean }>,
  valueThreshold: number
): HandDataMessage[] {
  const messages: HandDataMessage[] = [];

  for (const mapping of mappings) {
    if (!mapping.enabled) {
      continue;
    }

    const data = handData[mapping.hand];
    const message = buildMessageForMapping(mapping, data, lastSentValues, valueThreshold);

    if (message) {
      messages.push(message);
    }
  }

  return messages;
}
