import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

import { useHandStreamerStore } from "@/store/hand-streamer-store";
import { useMappingsStore } from "@/store/mappings-store";
import type { GestureHandData } from "@/types";

interface HandDataStreamerConfig {
  wsUrl: string;
  valueThreshold?: number;
  onStatusChange?: (status: "connected" | "disconnected" | "error") => void;
}

export const useHandDataStreamer = (config: HandDataStreamerConfig) => {
  const { wsUrl, valueThreshold = 0.001, onStatusChange } = config;

  const mappings = useMappingsStore((state) => state.mappings);
  const {
    start: storeStart,
    stop: storeStop,
    sendHandData: storeSendHandData,
    cleanupStaleEntries,
  } = useHandStreamerStore(
    useShallow((state) => ({
      start: state.start,
      stop: state.stop,
      sendHandData: state.sendHandData,
      cleanupStaleEntries: state.cleanupStaleEntries,
    }))
  );

  // Clean up stale entries when mappings change
  useEffect(() => {
    const validAddresses = new Set(mappings.map((m) => m.address));
    cleanupStaleEntries(validAddresses);
  }, [mappings, cleanupStaleEntries]);

  const sendHandData = useCallback(
    (handData: { left: GestureHandData; right: GestureHandData }) => {
      storeSendHandData(handData, mappings, valueThreshold);
    },
    [storeSendHandData, mappings, valueThreshold]
  );

  const start = useCallback(() => {
    storeStart(wsUrl, onStatusChange);
  }, [storeStart, wsUrl, onStatusChange]);

  const stop = useCallback(() => {
    storeStop();
  }, [storeStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => storeStop();
  }, [storeStop]);

  return { start, stop, sendHandData };
};
