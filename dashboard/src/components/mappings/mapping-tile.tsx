import {
  IconAdjustmentsHorizontal,
  IconHeadphones,
  IconTrash,
} from "@tabler/icons-react";
import { useShallow } from "zustand/react/shallow";
import { GestureIcon } from "@/components/gesture-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GESTURE_LABELS, GESTURES, MODE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useMappingsStore } from "@/store/mappings-store";
import type { Hand, Mapping, Mode } from "@/types";
import { Label } from "../ui/label";
import { MappingMonitor } from "./mapping-monitor";

export interface DragHandleProps {
  ref: React.Ref<HTMLButtonElement>;
}

const HAND_LABELS: Record<Hand, string> = { left: "Left", right: "Right" };

function ConfigPopover({
  mapping,
  onUpdate,
  onDelete,
  onSoloToggle,
  isSolo,
}: {
  mapping: Mapping;
  onUpdate: (name: keyof Mapping, value: string | boolean) => void;
  onDelete: () => void;
  onSoloToggle: () => void;
  isSolo: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Control settings"
          className="-my-1.5 size-7 text-print-dim opacity-0 transition-opacity hover:text-print focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          size="icon"
          variant="ghost"
        >
          <IconAdjustmentsHorizontal className="size-4" stroke={1.5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-4 p-4">
        <PopoverHeader>
          <PopoverTitle className="text-print text-sm">
            {MODE_LABELS[mapping.mode]} · {HAND_LABELS[mapping.hand]} hand
          </PopoverTitle>
          <PopoverDescription>
            Choose which hand and gesture drive this control.
          </PopoverDescription>
        </PopoverHeader>
        <ConfigFields mapping={mapping} onUpdate={onUpdate} />
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={onSoloToggle}
            variant={isSolo ? "default" : "secondary"}
          >
            <IconHeadphones className="size-4" stroke={1.5} />
            {isSolo ? "Unsolo" : "Solo"}
          </Button>
          <Button className="flex-1" onClick={onDelete} variant="destructive">
            <IconTrash className="size-4" stroke={1.5} />
            Remove
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ConfigFields({
  mapping,
  onUpdate,
}: {
  mapping: Mapping;
  onUpdate: (name: keyof Mapping, value: string | boolean) => void;
}) {
  const id = (field: string) => `${mapping.id}-${field}`;

  return (
    <div className="grid gap-2.5 text-sm">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor={id("enabled")}>Enabled</Label>
        <div className="col-span-2 flex items-center">
          <Switch
            checked={mapping.enabled}
            id={id("enabled")}
            onCheckedChange={(checked) => onUpdate("enabled", checked)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor={id("hand")}>Hand</Label>
        <Select
          onValueChange={(v: Hand) => onUpdate("hand", v)}
          value={mapping.hand}
        >
          <SelectTrigger className="col-span-2 h-8 w-full" id={id("hand")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["left", "right"] as const).map((hand) => (
              <SelectItem key={hand} value={hand}>
                {HAND_LABELS[hand]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor={id("gesture")}>Gesture</Label>
        <Select
          onValueChange={(v) => onUpdate("gesture", v)}
          value={mapping.gesture}
        >
          <SelectTrigger className="col-span-2 h-8 w-full" id={id("gesture")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GESTURES.map((g) => (
              <SelectItem key={g} value={g}>
                <GestureIcon className="size-4" gesture={g} />
                {GESTURE_LABELS[g]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor={id("mode")}>Mode</Label>
        <Select
          onValueChange={(v: Mode) => onUpdate("mode", v)}
          value={mapping.mode}
        >
          <SelectTrigger className="col-span-2 h-8 w-full" id={id("mode")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(MODE_LABELS) as Mode[]).map((mode) => (
              <SelectItem key={mode} value={mode}>
                {MODE_LABELS[mode]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor={id("address")}>OSC address</Label>
        <Input
          className="col-span-2 h-8 font-mono text-xs"
          id={id("address")}
          readOnly
          value={mapping.address}
        />
      </div>
    </div>
  );
}

export function MappingTile({
  mapping,
  dragHandleProps,
}: {
  mapping: Mapping;
  dragHandleProps?: DragHandleProps;
}) {
  const {
    updateMapping,
    deleteMapping,
    isolateMapping,
    enableAllMappings,
    isSolo,
  } = useMappingsStore(
    useShallow((state) => {
      const enabledMappings = state.mappings.filter((m) => m.enabled);
      return {
        updateMapping: state.updateMapping,
        deleteMapping: state.deleteMapping,
        isolateMapping: state.isolateMapping,
        enableAllMappings: state.enableAllMappings,
        isSolo:
          state.mappings.length > 1 &&
          enabledMappings.length === 1 &&
          enabledMappings[0].id === mapping.id,
      };
    })
  );

  const handleChange = (name: keyof Mapping, value: string | boolean) => {
    updateMapping(mapping.id, { [name]: value });
  };

  const handleSoloToggle = () => {
    if (isSolo) {
      enableAllMappings();
    } else {
      isolateMapping(mapping.id);
    }
  };

  return (
    <div
      className={cn(
        "group flex h-full flex-col px-3 pt-3 pb-2.5 transition-opacity",
        !mapping.enabled && "opacity-40"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          aria-label={`Reorder ${MODE_LABELS[mapping.mode]} control`}
          className="silkscreen -m-1 cursor-grab touch-none p-1 text-print focus-visible:outline-2 focus-visible:outline-print-dim active:cursor-grabbing"
          type="button"
          {...dragHandleProps}
        >
          {MODE_LABELS[mapping.mode]}
        </button>
        <div className="flex items-center gap-2">
          {isSolo ? <span className="silkscreen text-led">Solo</span> : null}
          {mapping.enabled ? null : (
            <span className="silkscreen text-print-dim">Off</span>
          )}
          <ConfigPopover
            isSolo={isSolo}
            mapping={mapping}
            onDelete={() => deleteMapping(mapping.id)}
            onSoloToggle={handleSoloToggle}
            onUpdate={handleChange}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <MappingMonitor mapping={mapping} />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="silkscreen truncate text-print">
            {GESTURE_LABELS[mapping.gesture]}
          </span>
          <span className="silkscreen shrink-0 text-print-dim">
            {mapping.hand === "left" ? "L" : "R"}
          </span>
        </div>
        <span className="truncate font-mono text-[10px] text-print-dim">
          {mapping.address}
        </span>
      </div>
    </div>
  );
}
