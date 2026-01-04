import { motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils/clamp";
import { useHandStore } from "@/store/hand-store";
import { useSwitchState } from "@/store/switch-state-store";
import type { Mapping } from "@/types";

export function MappingMonitor({ mapping }: { mapping: Mapping }) {
  switch (mapping.mode) {
    case "switch":
      return <SwitchMonitor mapping={mapping} />;
    case "trigger":
      return <TriggerMonitor mapping={mapping} />;
    case "fader":
      return <FaderMonitor mapping={mapping} />;
    case "knob":
      return <KnobMonitor mapping={mapping} />;
    default:
      return null;
  }
}

function SwitchMonitor({ mapping }: { mapping: Mapping }) {
  const switchState = useSwitchState(mapping.hand, mapping.gesture);

  return (
    <div
      className={cn(
        "flex h-20 w-20 items-center justify-center rounded-xl border-4",
        switchState
          ? "border-primary bg-primary/20"
          : "border-muted bg-muted/20"
      )}
    >
      <motion.div
        animate={{
          scale: [0.5, 1],
        }}
        className={cn(
          "h-10 w-10 rounded-lg transition-colors",
          switchState ? "bg-primary" : "bg-muted-foreground/20"
        )}
      />
    </div>
  );
}

function TriggerMonitor({ mapping }: { mapping: Mapping }) {
  const isActive = useHandStore(
    useShallow((state) => state[mapping.hand].gesture === mapping.gesture)
  );

  return (
    <div
      className={cn(
        "flex h-20 w-20 items-center justify-center rounded-full border-4",
        isActive
          ? "scale-95 border-primary bg-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.5)]"
          : "border-muted bg-muted/20"
      )}
    >
      <motion.div
        animate={{
          scale: [0.5, 1],
        }}
        className={cn(
          "h-8 w-8 rounded-full transition-colors",
          isActive ? "bg-primary" : "bg-muted-foreground/20"
        )}
      />
    </div>
  );
}

function FaderMonitor({ mapping }: { mapping: Mapping }) {
  const value = useHandStore(
    (state) => state[mapping.hand].gestureData[mapping.gesture]?.y ?? 0
  );
  const percentage = Math.max(0, Math.min(100, value * 100));

  return (
    <motion.div
      animate={{
        scaleY: [0.5, 1],
      }}
      className="relative h-20 w-8 overflow-hidden rounded-full bg-secondary/50"
    >
      <motion.div
        className="absolute bottom-0 w-full rounded-b-full bg-primary"
        style={{ height: `${percentage}%` }}
      />
    </motion.div>
  );
}

function KnobMonitor({ mapping }: { mapping: Mapping }) {
  const knobValue = useHandStore(
    (state) => state[mapping.hand].gestureData[mapping.gesture]?.rot ?? 0
  );
  const rotation = clamp(knobValue * 300 - 150, -150, 150);

  return (
    <motion.div
      animate={{
        scale: [0.5, 1],
        rotate: [360, 0],
      }}
      className="relative flex h-20 w-20 items-center justify-center rounded-full border border-secondary bg-secondary/20"
    >
      <motion.div
        className="absolute h-full w-1 bg-primary/50"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="absolute top-0 h-4 w-full bg-primary" />
      </motion.div>
      <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-card font-mono text-[10px] shadow-sm">
        {knobValue.toFixed(1)}
      </div>
    </motion.div>
  );
}
