import { useAtom } from "jotai";
import { currentHandDataAtom } from "../atoms";

export const SensorDataDisplay = () => {
  const [handData] = useAtom(currentHandDataAtom);

  return (
    <div className="rounded-none border border-border bg-card p-4 text-xs/relaxed ring-1 ring-foreground/10">
      <h3 className="mb-2 font-medium text-xs uppercase opacity-50">
        Current Sensor Data
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {(["left", "right"] as const).map((h) => (
          <div className="space-y-1" key={h}>
            <p className="font-medium text-xs uppercase">{h}</p>
            <p className="font-mono text-xs">
              Y: {handData[h]?.y.toFixed(2) ?? "—"}
            </p>
            <p className="font-mono text-xs">
              Rot: {handData[h]?.rot.toFixed(2) ?? "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
