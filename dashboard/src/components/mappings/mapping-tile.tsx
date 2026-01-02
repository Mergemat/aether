import {
  IconFocus2,
  IconGripVertical,
  IconHandStop,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { useShallow } from "zustand/react/shallow";
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
import { GESTURE_EMOJIS, GESTURES } from "@/lib/constants";
import { useMappingsStore } from "@/store/mappings-store";
import type { Hand, Mapping, Mode } from "@/types";
import { Label } from "../ui/label";
import { MappingMonitor } from "./mapping-monitor";

export interface DragHandleProps {
  ref: React.Ref<HTMLButtonElement>;
}

function DragHandle({ dragHandleProps }: { dragHandleProps: DragHandleProps }) {
  return (
    <button
      className="absolute bottom-2 left-2 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-muted-foreground active:cursor-grabbing"
      type="button"
      {...dragHandleProps}
    >
      <IconGripVertical className="h-3.5 w-3.5" />
    </button>
  );
}

function HandIndicator({ hand }: { hand: Hand }) {
  return (
    <div className="absolute flex items-center gap-1.5 rounded-full bg-secondary/50 px-2 py-1 backdrop-blur-sm">
      <IconHandStop
        className={`h-3.5 w-3.5 text-muted-foreground ${hand === "left" ? "scale-x-[-1]" : ""}`}
      />
      <span className="text-xs leading-none">{hand}</span>
    </div>
  );
}

function ConfigPopover({
  mapping,
  onUpdate,
  onDelete,
  onIsolateToggle,
  isIsolated,
}: {
  mapping: Mapping;
  onUpdate: (name: keyof Mapping, value: string | boolean) => void;
  onDelete: () => void;
  onIsolateToggle: () => void;
  isIsolated: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="absolute right-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
          size="icon"
          variant="ghost"
        >
          <IconSettings className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <PopoverHeader>
            <PopoverTitle>Configuration</PopoverTitle>
            <PopoverDescription>
              Configure the gesture mapping.
            </PopoverDescription>
          </PopoverHeader>
          <ConfigFields mapping={mapping} onUpdate={onUpdate} />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={onIsolateToggle}
              variant={isIsolated ? "default" : "secondary"}
            >
              <IconFocus2 className="mr-2 h-4 w-4" />
              {isIsolated ? "Un-isolate" : "Isolate"}
            </Button>
            <Button className="flex-1" onClick={onDelete} variant="destructive">
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
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
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="enabled">Enabled</Label>
        <div className="col-span-2 flex items-center">
          <Switch
            checked={mapping.enabled}
            id="enabled"
            onCheckedChange={(checked) => onUpdate("enabled", checked)}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <span className="text-sm">Hand</span>
        <Select
          onValueChange={(v: Hand) => onUpdate("hand", v)}
          value={mapping.hand}
        >
          <SelectTrigger className="col-span-2 h-8 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="gesture">Gesture</Label>
        <Select
          onValueChange={(v) => onUpdate("gesture", v)}
          value={mapping.gesture}
        >
          <SelectTrigger className="col-span-2 h-8 w-full" id="gesture">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GESTURES.map((g) => (
              <SelectItem key={g} value={g}>
                <span className="mr-2">{GESTURE_EMOJIS[g]}</span>
                {g.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="mode">Mode</Label>
        <Select
          onValueChange={(v: Mode) => onUpdate("mode", v)}
          value={mapping.mode}
        >
          <SelectTrigger className="col-span-2 h-8 w-full" id="mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trigger">Trigger</SelectItem>
            <SelectItem value="fader">Fader</SelectItem>
            <SelectItem value="knob">Knob</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 items-center gap-4">
        <Label htmlFor="address">Address</Label>
        <Input
          className="col-span-2 h-8 font-mono text-xs"
          id="address"
          readOnly
          value={mapping.address}
        />
      </div>
    </div>
  );
}

function TileHeader({
  mapping,
  onUpdate,
  onDelete,
  onIsolateToggle,
  isIsolated,
}: {
  mapping: Mapping;
  onUpdate: (name: keyof Mapping, value: string | boolean) => void;
  onDelete: () => void;
  onIsolateToggle: () => void;
  isIsolated: boolean;
}) {
  return (
    <>
      <HandIndicator hand={mapping.hand} />
      <ConfigPopover
        isIsolated={isIsolated}
        mapping={mapping}
        onDelete={onDelete}
        onIsolateToggle={onIsolateToggle}
        onUpdate={onUpdate}
      />
    </>
  );
}

function TileFooter({
  mapping,
  dragHandleProps,
}: {
  mapping: Mapping;
  dragHandleProps?: DragHandleProps;
}) {
  return (
    <>
      {dragHandleProps ? (
        <DragHandle dragHandleProps={dragHandleProps} />
      ) : (
        <div />
      )}
      <span className="absolute right-2 bottom-2 text-lg leading-none">
        {GESTURE_EMOJIS[mapping.gesture]}
      </span>
    </>
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
    isolated,
  } = useMappingsStore(
    useShallow((state) => {
      const enabledMappings = state.mappings.filter((m) => m.enabled);
      const isIsolated =
        enabledMappings.length === 1 && enabledMappings[0].id === mapping.id;
      return {
        updateMapping: state.updateMapping,
        deleteMapping: state.deleteMapping,
        isolateMapping: state.isolateMapping,
        enableAllMappings: state.enableAllMappings,
        isolated: isIsolated,
      };
    })
  );

  const handleChange = (name: keyof Mapping, value: string | boolean) => {
    updateMapping(mapping.id, { [name]: value });
  };

  const handleDelete = () => {
    deleteMapping(mapping.id);
  };

  const handleIsolateToggle = () => {
    if (isolated) {
      enableAllMappings();
    } else {
      isolateMapping(mapping.id);
    }
  };

  return (
    <div
      className={`group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border bg-card p-2 shadow-sm transition-all hover:shadow-md ${mapping.enabled ? "" : "opacity-50"}`}
    >
      <TileHeader
        isIsolated={isolated}
        mapping={mapping}
        onDelete={handleDelete}
        onIsolateToggle={handleIsolateToggle}
        onUpdate={handleChange}
      />
      <div className="flex flex-1 items-center justify-center">
        <MappingMonitor mapping={mapping} />
      </div>
      <TileFooter dragHandleProps={dragHandleProps} mapping={mapping} />
    </div>
  );
}
