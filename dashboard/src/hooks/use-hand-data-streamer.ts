import { useRef } from "react";

import { WebSocketClient } from "@/services/websocket-client";
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
  const clientRef = useRef<WebSocketClient | null>(null);
  const lastSentValuesRef = useRef<Map<string, number>>(new Map());
  const isStreamingRef = useRef(false);

  const finalConfig = {
    valueThreshold: 0.001,
    ...config,
  };

  const sendHandData = (
    handData: { left: HandData; right: HandData },
    mappings: Mapping[]
  ) => {
    if (!clientRef.current) {
      return;
    }

    if (!clientRef.current.isConnected()) {
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
      return;
    }

    isStreamingRef.current = true;

    clientRef.current = new WebSocketClient(
      { url: finalConfig.wsUrl },
      {
        onOpen: () => {
          lastSentValuesRef.current.clear();
          config.onStatusChange?.("connected");
        },
        onClose: () => {
          config.onStatusChange?.("disconnected");
        },
        onError: () => {
          config.onStatusChange?.("error");
        },
      }
    );

    clientRef.current.connect();
  };

  const stop = () => {
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
