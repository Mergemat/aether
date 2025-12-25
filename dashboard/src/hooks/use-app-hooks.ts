import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import { liveValuesAtom, mappingsAtom } from "@/atoms";
import type { HandData, Mapping } from "@/types";
import { getNextAvailableAddress, uid } from "@/utils";

export const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("wss://localhost:8888");
    ws.current = socket;
    return () => socket.close();
  }, []);

  return ws;
};

export const useMappingsPersistence = (
  mappings: Mapping[],
  setMappings: (arg: Mapping[] | ((prev: Mapping[]) => Mapping[])) => void
) => {
  useEffect(() => {
    const saved = localStorage.getItem("phantomfader:mappings");
    if (saved) {
      try {
        setMappings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse mappings", e);
      }
    }
  }, [setMappings]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const mappingsToPersist = mappings.map(({ value, ...rest }) => rest);
      localStorage.setItem(
        "phantomfader:mappings",
        JSON.stringify(mappingsToPersist)
      );
    }, 500);
    return () => clearTimeout(timeout);
  }, [mappings]);
};

export const useLiveValues = (
  liveValues: React.RefObject<Record<string, number>>
) => {
  const setLiveValues = useSetAtom(liveValuesAtom);

  useEffect(() => {
    const id = setInterval(() => {
      setLiveValues((prev) => {
        const changed =
          JSON.stringify(prev) !== JSON.stringify(liveValues.current);
        return changed ? { ...liveValues.current } : prev;
      });
    }, 33);
    return () => clearInterval(id);
  }, [liveValues, setLiveValues]);
};

export const useMappingOperations = () => {
  const [mappings, setMappings] = useAtom(mappingsAtom);

  const updateMapping = useCallback(
    (id: string, updates: Partial<Mapping>) => {
      setMappings((ms) =>
        ms.map((m) => {
          if (m.id !== id) {
            return m;
          }

          const updated = { ...m, ...updates };

          if (updates.gesture !== undefined || updates.hand !== undefined) {
            updated.address = getNextAvailableAddress(
              ms,
              updated.hand,
              updated.gesture,
              updated.mode
            );
          }

          return updated;
        })
      );
    },
    [setMappings]
  );

  const deleteMapping = useCallback(
    (id: string) => {
      setMappings((ms) => ms.filter((x) => x.id !== id));
    },
    [setMappings]
  );

  const addMapping = useCallback(() => {
    setMappings((ms) => {
      const gesture = "Open_Palm";
      const hand: Hand = "left";
      const mode = "fader";

      return [
        ...ms,
        {
          id: uid(),
          enabled: true,
          gesture,
          hand,
          address: getNextAvailableAddress(ms, hand, gesture, mode),
          mode,
          range: { min: 0.3, max: 0.7 },
          value: 0,
        },
      ];
    });
  }, [setMappings]);

  const calibrate = useCallback(
    (
      latestHandDataRef: React.RefObject<{
        left: HandData | null;
        right: HandData | null;
      }>,
      mapping: Mapping,
      type: "min" | "max"
    ) => {
      const data = latestHandDataRef.current[mapping.hand];
      if (!data) {
        return;
      }

      const val = mapping.mode === "knob" ? data.rot : data.y;

      setMappings((ms) =>
        ms.map((m) =>
          m.id === mapping.id ? { ...m, range: { ...m.range, [type]: val } } : m
        )
      );
    },
    [setMappings]
  );

  return {
    mappings,
    setMappings,
    calibrate,
    updateMapping,
    deleteMapping,
    addMapping,
  };
};

export const useDetectionState = () => {
  const liveValues = useRef<Record<string, number>>({});
  const smoothedValues = useRef<Record<string, number>>({});
  const lastTrigger = useRef<Record<string, number>>({});
  const latestHandDataRef = useRef<{
    left: HandData | null;
    right: HandData | null;
  }>({ left: null, right: null });

  return {
    liveValues,
    smoothedValues,
    lastTrigger,
    latestHandDataRef,
  };
};
