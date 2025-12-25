import { useAtomValue } from "jotai";
import { liveValuesAtom } from "@/atoms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMappingOperations } from "@/hooks/use-app-hooks";
import type { Hand, Mapping, Mode } from "@/types";
import { GESTURES } from "@/utils";

const MappingValueIndicator = ({ id, mode }: { id: string; mode: Mode }) => {
  const values = useAtomValue(liveValuesAtom);
  const value = values[id] ?? 0;

  return (
    <div className="flex flex-col gap-1 px-1">
      <div className="flex justify-between font-medium text-xs uppercase">
        <span className="opacity-50">{mode}</span>
        <span className="font-mono text-primary">{value.toFixed(2)}</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-none border border-border bg-muted">
        <div
          className="h-full bg-primary transition-all duration-75"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
};

interface MappingCardProps {
  // Pass only the static config data, or ensure the parent doesn't change this object on value updates
  mapping: Omit<Mapping, "value">;
  // onCalibrate: (mapping: Mapping, type: "min" | "max") => void;
}

export const MappingCard = ({ mapping }: MappingCardProps) => {
  const { updateMapping, deleteMapping } = useMappingOperations();

  return (
    <div className="grid grid-cols-[auto_130px_90px_1fr_90px_160px_120px_40px] items-center gap-4 rounded-none border border-border bg-card px-4 py-3 text-xs/relaxed ring-1 ring-foreground/10">
      <input
        checked={mapping.enabled}
        className="h-4 w-4"
        onChange={(e) =>
          updateMapping(mapping.id, { enabled: e.target.checked })
        }
        type="checkbox"
      />

      <Select
        onValueChange={(v) => updateMapping(mapping.id, { gesture: v })}
        value={mapping.gesture}
      >
        <SelectTrigger className="h-8 font-medium text-xs uppercase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GESTURES.map((g) => (
            <SelectItem key={g} value={g}>
              {g.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        onValueChange={(v) => updateMapping(mapping.id, { hand: v as Hand })}
        value={mapping.hand}
      >
        <SelectTrigger className="h-8 font-medium text-xs uppercase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="left">Left</SelectItem>
          <SelectItem value="right">Right</SelectItem>
        </SelectContent>
      </Select>

      <Input
        className="h-8 select-all border-none bg-background/50 font-mono text-xs"
        readOnly
        value={mapping.address}
      />

      <Select
        onValueChange={(v) => updateMapping(mapping.id, { mode: v as Mode })}
        value={mapping.mode}
      >
        <SelectTrigger className="h-8 font-medium text-xs uppercase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="trigger">Trig</SelectItem>
          <SelectItem value="fader">Fader</SelectItem>
          <SelectItem value="knob">Knob</SelectItem>
        </SelectContent>
      </Select>

      {/* <div className="flex items-center gap-1"> */}
      {/*   {mapping.mode !== "trigger" && ( */}
      {/*     <> */}
      {/*       <Button */}
      {/*         className="h-7 px-2 font-medium text-xs" */}
      {/*         onClick={() => onCalibrate(mapping, "min")} */}
      {/*         size="sm" */}
      {/*         variant="secondary" */}
      {/*       > */}
      {/*         Min */}
      {/*       </Button> */}
      {/*       <Button */}
      {/*         className="h-7 px-2 font-medium text-xs" */}
      {/*         onClick={() => onCalibrate(mapping, "max")} */}
      {/*         size="sm" */}
      {/*         variant="secondary" */}
      {/*       > */}
      {/*         Max */}
      {/*       </Button> */}
      {/*       <span className="ml-1 font-mono text-xs opacity-50"> */}
      {/*         [{mapping.range.min.toFixed(1)} / {mapping.range.max.toFixed(1)}] */}
      {/*       </span> */}
      {/*     </> */}
      {/*   )} */}
      {/* </div> */}

      {/* This component is the only part that re-renders 30 times per second */}
      <MappingValueIndicator id={mapping.id} mode={mapping.mode} />

      <Button
        className="h-8 w-8 rounded-none hover:text-destructive"
        onClick={() => deleteMapping(mapping.id)}
        size="icon"
        variant="ghost"
      >
        ✕
      </Button>
    </div>
  );
};
