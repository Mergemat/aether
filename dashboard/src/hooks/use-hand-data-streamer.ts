import { useRef } from "react";
import perfLogger from "@/lib/utils/logger";
import { WebSocketClient } from "@/services/websocket-client";
import { useMappingsStore } from "@/store/mappings-store";
import type { Mapping } from "@/types";

interface HandDataStreamerConfig {
  wsUrl: string;
  valueThreshold?: number;
  onStatusChange?: (status: "connected" | "disconnected" | "error") => void;
}

interface HandData {
  gesture: string;
  y: number;
  rot: number;
}

interface HandDataMessage {
  address: string;
  value: number;
}

export const useHandDataStreamer = (config: HandDataStreamerConfig) => {
  perfLogger.hookInit("useHandDataStreamer", config);

  const clientRef = useRef<WebSocketClient | null>(null);
  const lastSentValuesRef = useRef<Map<string, number>>(new Map());
  const isStreamingRef = useRef(false);

  const mappings = useMappingsStore((state) => state.mappings);

  const finalConfig = {
    valueThreshold: 0.001,
    ...config,
  };

  const sendHandData = (handData: { left: HandData; right: HandData }) => {
    if (!clientRef.current) {
      perfLogger.event(
        "useHandDataStreamer",
        "sendHandData skipped - no client"
      );
      return;
    }

    if (!clientRef.current.isConnected()) {
      perfLogger.event(
        "useHandDataStreamer",
        "sendHandData skipped - not connected"
      );
      return;
    }

    const messages = buildMessages(
      handData,
      mappings,
      lastSentValuesRef.current,
      finalConfig.valueThreshold
    );

    if (messages.length === 0) {
      return;
    }

    sendMessages(clientRef.current, messages);
  };

  const start = () => {
    if (isStreamingRef.current) {
      perfLogger.event(
        "useHandDataStreamer",
        "start skipped - already streaming"
      );
      return;
    }

    perfLogger.event("useHandDataStreamer | start called", {
      url: finalConfig.wsUrl,
    });
    isStreamingRef.current = true;

    clientRef.current = new WebSocketClient(
      { url: finalConfig.wsUrl },
      {
        onOpen: () => {
          perfLogger.websocket("connected", { url: finalConfig.wsUrl });
          lastSentValuesRef.current.clear();
          config.onStatusChange?.("connected");
        },
        onClose: () => {
          perfLogger.websocket("disconnected", { url: finalConfig.wsUrl });
          config.onStatusChange?.("disconnected");
        },
        onError: () => {
          perfLogger.websocket("error", { url: finalConfig.wsUrl });
          config.onStatusChange?.("error");
        },
      }
    );

    clientRef.current.connect();
  };

  const stop = () => {
    perfLogger.event("useHandDataStreamer", "stop called");
    isStreamingRef.current = false;

    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  };

  return { start, stop, sendHandData };
};

function buildMessages(
  handData: { left: HandData; right: HandData },
  mappings: Mapping[],
  lastSentValues: Map<string, number>,
  valueThreshold: number
): HandDataMessage[] {
  const messages: HandDataMessage[] = [];

  for (const mapping of mappings) {
    if (!mapping.enabled) {
      continue;
    }

    const data = handData[mapping.hand];
    if (data.gesture !== mapping.gesture) {
      continue;
    }

    const value = mapping.mode === "fader" ? data.y : data.rot;
    const lastValue = lastSentValues.get(mapping.address);

    if (
      lastValue !== undefined &&
      Math.abs(value - lastValue) < valueThreshold
    ) {
      continue;
    }

    messages.push({ address: mapping.address, value });
    lastSentValues.set(mapping.address, value);
  }

  return messages;
}

function sendMessages(client: WebSocketClient, messages: HandDataMessage[]) {
  for (const message of messages) {
    client.send(message);
  }
}
