import { useEffect, useRef } from "react";
import perfLogger from "@/lib/utils/logger";
import { WebSocketClient } from "@/services/websocket-client";
import { useMappingsStore } from "@/store/mappings-store";
import type { GestureHandData, Mapping } from "@/types";

interface HandDataStreamerConfig {
  wsUrl: string;
  valueThreshold?: number;
  onStatusChange?: (status: "connected" | "disconnected" | "error") => void;
}

type HandData = GestureHandData;

interface HandDataMessage {
  address: string;
  value: number;
}

export const useHandDataStreamer = (config: HandDataStreamerConfig) => {
  perfLogger.hookInit("useHandDataStreamer", config);

  const clientRef = useRef<WebSocketClient | null>(null);
  const lastSentValuesRef = useRef<Map<string, number>>(new Map());
  const isStreamingRef = useRef(false);

  // Store config in ref to avoid stale closures
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const mappings = useMappingsStore((state) => state.mappings);

  // Store mappings in ref for stable closure
  const mappingsRef = useRef(mappings);
  useEffect(() => {
    mappingsRef.current = mappings;

    // Clean up stale entries from lastSentValuesRef when mappings change
    // This prevents memory leak from removed mappings
    const validAddresses = new Set(mappings.map((m) => m.address));
    for (const key of lastSentValuesRef.current.keys()) {
      if (!validAddresses.has(key)) {
        lastSentValuesRef.current.delete(key);
      }
    }
  }, [mappings]);

  const valueThreshold = config.valueThreshold ?? 0.001; // Lower threshold for minimal latency

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
      mappingsRef.current,
      lastSentValuesRef.current,
      valueThreshold
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

    const currentConfig = configRef.current;

    perfLogger.event("useHandDataStreamer | start called", {
      url: currentConfig.wsUrl,
    });
    isStreamingRef.current = true;

    clientRef.current = new WebSocketClient(
      { url: currentConfig.wsUrl },
      {
        onOpen: () => {
          perfLogger.websocket("connected", { url: currentConfig.wsUrl });
          lastSentValuesRef.current.clear();
          currentConfig.onStatusChange?.("connected");
        },
        onClose: () => {
          perfLogger.websocket("disconnected", { url: currentConfig.wsUrl });
          currentConfig.onStatusChange?.("disconnected");
        },
        onError: () => {
          perfLogger.websocket("error", { url: currentConfig.wsUrl });
          currentConfig.onStatusChange?.("error");
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
      clientRef.current = null;
    }

    lastSentValuesRef.current.clear();
  };

  // CRITICAL: Cleanup on unmount
  useEffect(() => {
    return () => {
      perfLogger.hookCleanup("useHandDataStreamer");
      isStreamingRef.current = false;

      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
        perfLogger.event(
          "useHandDataStreamer",
          "client disconnected on cleanup"
        );
      }

      lastSentValuesRef.current.clear();
    };
  }, []);

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
    const hasSignificantChange =
      lastValue === undefined || Math.abs(value - lastValue) >= valueThreshold;

    if (!hasSignificantChange) {
      continue;
    }

    messages.push({ address: mapping.address, value });
    lastSentValues.set(mapping.address, value);
  }

  return messages;
}

function sendMessages(client: WebSocketClient, messages: HandDataMessage[]) {
  // Binary protocol for minimal latency
  client.sendOscBinary(messages);
}
