import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils/clamp";
import { useHandStore } from "@/store/hand-store";
import type { Mapping } from "@/types";

export function MappingMonitor({ mapping }: { mapping: Mapping }) {
  const { handData, activeGesture } = useHandStore(
    useShallow((state) => ({
      handData: state[mapping.hand].gestureData[mapping.gesture],
      activeGesture: state[mapping.hand].gesture,
    }))
  );

  const isActive = activeGesture === mapping.gesture;
  const value = handData?.y ?? 0;
  const knobValue = handData?.rot ?? 0;

  if (mapping.mode === "trigger") {
    return (
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full border-4",
          isActive
            ? "scale-95 border-primary bg-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.5)]"
            : "border-muted bg-muted/20"
        )}
      >
        {activeGesture}
        <div
          className={cn(
            "h-8 w-8 rounded-full transition-colors",
            isActive ? "bg-primary" : "bg-muted-foreground/20"
          )}
        />
      </div>
    );
  }

  if (mapping.mode === "fader") {
    const percentage = Math.max(0, Math.min(100, value * 100));
    return (
      <div className="relative h-20 w-8 overflow-hidden rounded-full bg-secondary/50">
        <div
          className="absolute bottom-0 w-full rounded-b-full bg-primary"
          style={{ height: `${percentage}%` }}
        />
      </div>
    );
  }

  if (mapping.mode === "knob") {
    const rotation = clamp(knobValue * 300 - 150, -150, 150);
    return (
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-secondary bg-secondary/20">
        <div
          className="absolute h-full w-1 bg-primary/50"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="absolute top-1 h-3 w-full rounded-full bg-primary" />
        </div>
        <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-card font-mono text-[10px] shadow-sm">
          {knobValue.toFixed(1)}
        </div>
      </div>
    );
  }

  return null;
}
