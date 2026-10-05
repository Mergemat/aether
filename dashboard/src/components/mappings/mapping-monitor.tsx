import { useEffect, useEffectEvent, useRef } from "react";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils/clamp";
import { useHandStore } from "@/store/hand-store";
import { useSwitchState } from "@/store/switch-state-store";
import type { Mapping } from "@/types";

/**
 * Calls `onChange` with a gesture's latest y/rot outside of React. These
 * values change every camera frame, so writing them straight to the DOM
 * avoids re-rendering the control 30-60 times a second.
 */
function useHandValue(
  mapping: Mapping,
  key: "y" | "rot",
  onChange: (value: number) => void
) {
  const apply = useEffectEvent(onChange);
  const { hand, gesture } = mapping;

  useEffect(() => {
    const read = (state: ReturnType<typeof useHandStore.getState>) =>
      state[hand].gestureData[gesture]?.[key] ?? 0;

    let last = read(useHandStore.getState());
    apply(last);

    return useHandStore.subscribe((state) => {
      const value = read(state);
      if (value !== last) {
        last = value;
        apply(value);
      }
    });
  }, [hand, gesture, key]);
}

function useGestureActive(mapping: Mapping) {
  return useHandStore(
    (state) => state[mapping.hand].gesture === mapping.gesture
  );
}

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

const Readout = ({
  children,
  ref,
}: {
  children?: React.ReactNode;
  ref?: React.Ref<HTMLSpanElement>;
}) => (
  <span className="font-mono text-print text-xs tabular-nums" ref={ref}>
    {children}
  </span>
);

function SwitchMonitor({ mapping }: { mapping: Mapping }) {
  const on = useSwitchState(mapping.hand, mapping.gesture);

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "size-2 rounded-full",
          on ? "bg-led shadow-[0_0_8px_rgba(229,57,43,0.6)]" : "bg-[#3a3b3f]"
        )}
      />
      <div className="flex flex-col items-center gap-1.5">
        <span className="silkscreen text-[10px] text-print-dim">On</span>
        <div className="flex h-14 w-8 flex-col rounded-full border border-black bg-[#0f1011] p-1">
          <span
            className={cn(
              "size-6 rounded-full bg-[#a29f99] shadow-[0_2px_3px_rgba(0,0,0,0.6)] transition-transform duration-150 motion-reduce:transition-none",
              on ? "translate-y-0" : "translate-y-5"
            )}
          />
        </div>
        <span className="silkscreen text-[10px] text-print-dim">Off</span>
      </div>
    </div>
  );
}

function TriggerMonitor({ mapping }: { mapping: Mapping }) {
  const active = useGestureActive(mapping);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "size-16 rounded-md border border-black",
          active
            ? "bg-led shadow-[0_0_18px_rgba(229,57,43,0.55)]"
            : "bg-[#232428] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        )}
      />
      <Readout>{active ? "ON" : "OFF"}</Readout>
    </div>
  );
}

const SCALE = Array.from({ length: 11 }, (_, i) => i);

function FaderMonitor({ mapping }: { mapping: Mapping }) {
  const capRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  useHandValue(mapping, "y", (value) => {
    if (capRef.current) {
      capRef.current.style.bottom = `${clamp(value, 0, 1) * 100}%`;
    }
    if (valueRef.current) {
      valueRef.current.textContent = value.toFixed(2);
    }
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-16">
        <span className="absolute top-0 left-0 -translate-y-1/2 font-mono text-[9px] text-print-dim">
          1
        </span>
        <span className="absolute bottom-0 left-0 translate-y-1/2 font-mono text-[9px] text-print-dim">
          0
        </span>
        <div className="absolute inset-y-0 left-3.5 flex flex-col justify-between">
          {SCALE.map((tick) => (
            <span
              className={cn(
                "h-px bg-print",
                tick % 5 === 0 ? "w-3" : "w-1.5 opacity-60"
              )}
              key={tick}
            />
          ))}
        </div>
        <div className="absolute inset-y-0 left-1/2 ml-1.5 w-1.5 -translate-x-1/2 rounded-full bg-black" />
        <div
          className="absolute left-1/2 ml-1.5 h-5 w-10 -translate-x-1/2 translate-y-1/2 rounded-sm border border-black bg-[#2b2c30] shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
          ref={capRef}
        >
          <span className="absolute inset-x-1 top-1/2 h-px bg-print" />
        </div>
      </div>
      <Readout ref={valueRef} />
    </div>
  );
}

// Printed knob scale: 270° from bottom-left to bottom-right
const KNOB_TICKS = SCALE.map((i) => {
  const angle = ((135 + i * 27) * Math.PI) / 180;
  const inner = i % 5 === 0 ? 38 : 41;
  return {
    i,
    x1: 50 + Math.cos(angle) * inner,
    y1: 50 + Math.sin(angle) * inner,
    x2: 50 + Math.cos(angle) * 45,
    y2: 50 + Math.sin(angle) * 45,
  };
});
// Value arc just inside the scale, radius 34 around (50, 50)
const KNOB_ARC = "M 25.96 74.04 A 34 34 0 1 1 74.04 74.04";

function KnobMonitor({ mapping }: { mapping: Mapping }) {
  const arcRef = useRef<SVGPathElement>(null);
  const pointerRef = useRef<SVGGElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  useHandValue(mapping, "rot", (value) => {
    const v = clamp(value, 0, 1);
    arcRef.current?.setAttribute("stroke-dashoffset", String(100 - v * 100));
    pointerRef.current?.setAttribute(
      "transform",
      `rotate(${135 + v * 270} 50 50)`
    );
    if (valueRef.current) {
      valueRef.current.textContent = value.toFixed(2);
    }
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <svg aria-hidden className="size-28" viewBox="0 0 100 100">
        {KNOB_TICKS.map(({ i, ...line }) => (
          <line
            className="stroke-print"
            key={i}
            opacity={i % 5 === 0 ? 1 : 0.6}
            strokeWidth={1}
            {...line}
          />
        ))}
        <text
          className="fill-print-dim font-mono"
          fontSize={7}
          textAnchor="middle"
          x={17}
          y={92}
        >
          0
        </text>
        <text
          className="fill-print-dim font-mono"
          fontSize={7}
          textAnchor="middle"
          x={83}
          y={92}
        >
          1
        </text>
        <path
          className="stroke-print"
          d={KNOB_ARC}
          fill="none"
          pathLength={100}
          ref={arcRef}
          strokeDasharray="100"
          strokeDashoffset="100"
          strokeWidth={1.5}
        />
        <circle cx={50} cy={50} fill="#2b2c30" r={29} stroke="#000" />
        <circle cx={50} cy={50} fill="#131416" r={23} />
        <g ref={pointerRef} transform="rotate(135 50 50)">
          <line
            className="stroke-print"
            strokeLinecap="round"
            strokeWidth={3}
            x1={60}
            x2={77}
            y1={50}
            y2={50}
          />
        </g>
      </svg>
      <Readout ref={valueRef} />
    </div>
  );
}
