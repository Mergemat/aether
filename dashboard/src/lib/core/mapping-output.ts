import type { OscMessage } from "@/lib/osc";
import type { BothHandsData, GestureHandData, Mapping } from "@/types";

const VALUE_THRESHOLD = 0.001;

interface SentEntry {
  switchState?: boolean;
  value: number;
}

type SentValues = Map<string, SentEntry>;

function buildMessageForMapping(
  mapping: Mapping,
  data: GestureHandData,
  lastSentValues: SentValues
): OscMessage | null {
  const gestureMatched = data.gesture === mapping.gesture;
  const lastEntry = lastSentValues.get(mapping.address);

  // SWITCH MODE: toggle on gesture activation (rising edge)
  if (mapping.mode === "switch") {
    const wasActive = lastEntry?.value === 1;

    // Rising edge: gesture just became active → toggle
    if (gestureMatched && !wasActive) {
      const newSwitchState = !(lastEntry?.switchState ?? false);
      lastSentValues.set(mapping.address, {
        value: 1,
        switchState: newSwitchState,
      });
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
    lastEntry?.value === undefined ||
    Math.abs(value - lastEntry.value) >= VALUE_THRESHOLD;

  if (!hasSignificantChange) {
    return null;
  }

  lastSentValues.set(mapping.address, { value });
  return { address: mapping.address, value };
}

/**
 * Turns per-frame hand data into the OSC messages that changed since the
 * last send, tracking switch/trigger state per mapping address.
 */
export function createMappingOutput() {
  const lastSentValues: SentValues = new Map();
  const messages: OscMessage[] = [];
  let mappings: Mapping[] = [];

  return {
    setMappings(next: Mapping[]) {
      mappings = next;
      const validAddresses = new Set(next.map((m) => m.address));
      for (const address of lastSentValues.keys()) {
        if (!validAddresses.has(address)) {
          lastSentValues.delete(address);
        }
      }
    },

    /** Forget what was sent, e.g. after reconnecting to the bridge */
    reset() {
      lastSentValues.clear();
    },

    /** The returned array is reused across calls */
    build(hands: BothHandsData): OscMessage[] {
      messages.length = 0;
      for (const mapping of mappings) {
        if (!mapping.enabled) {
          continue;
        }
        const message = buildMessageForMapping(
          mapping,
          hands[mapping.hand],
          lastSentValues
        );
        if (message) {
          messages.push(message);
        }
      }
      return messages;
    },
  };
}
