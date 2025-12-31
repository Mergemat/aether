import {
  IconHandStop,
  IconPlus,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { Reorder } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GESTURE_EMOJIS, GESTURES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils/clamp";
import perfLogger from "@/lib/utils/logger";
import { useHandStore } from "@/store/hand-store";
import { useMappingsStore } from "@/store/mappings-store";
import type { Hand, Mapping, Mode } from "@/types";

export function Mappings() {
  perfLogger.componentRender("Mappings");

  const mappings = useMappingsStore((state) => state.mappings);
  const addMapping = useMappingsStore((state) => state.addMapping);
  const reorderMappings = useMappingsStore((state) => state.reorderMappings);

  // Local state for drag reordering - prevents store updates during drag
  const [localMappings, setLocalMappings] = useState(mappings);
  const isDragging = useRef(false);

  // Sync local state when store changes (but not during drag)
  useEffect(() => {
    if (!isDragging.current) {
      setLocalMappings(mappings);
    }
  }, [mappings]);

  const onNewMapping = () => {
    addMapping({
      hand: "right",
      gesture: "Open_Palm",
      mode: "trigger",
      enabled: true,
    });
  };

  const handleReorder = (newOrder: Mapping[]) => {
    isDragging.current = true;
    setLocalMappings(newOrder);
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    // Only update store when drag ends
    reorderMappings(localMappings);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg tracking-tight">Mappings</h2>
        <Button className="h-8 gap-2" onClick={onNewMapping} size="sm">
          <IconPlus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Reorder.Group
        axis="x"
        className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
        onReorder={handleReorder}
        values={localMappings}
      >
        {localMappings.map((mapping) => (
          <Reorder.Item
            className="relative"
            drag
            key={mapping.id}
            onDragEnd={handleDragEnd}
            value={mapping}
          >
            <MappingTile mapping={mapping} />
          </Reorder.Item>
        ))}
        {localMappings.length === 0 && (
          <div className="col-span-full flex h-32 items-center justify-center rounded-xl border-2 border-dashed text-muted-foreground text-sm">
            No mappings configured
          </div>
        )}
      </Reorder.Group>
    </div>
  );
}

function MappingTile({ mapping }: { mapping: Mapping }) {
  const { updateMapping, deleteMapping } = useMappingsStore(
    useShallow((state) => ({
      updateMapping: state.updateMapping,
      deleteMapping: state.deleteMapping,
    }))
  );

  const handleChange = (name: keyof Mapping, value: string | boolean) => {
    updateMapping(mapping.id, { [name]: value });
  };

  return (
    <div className="group relative flex aspect-square flex-col justify-between overflow-hidden rounded-2xl border bg-card p-3 shadow-sm transition-all hover:shadow-md">
      {/* Header: Icons and Config */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-2 py-1 backdrop-blur-sm">
          {mapping.hand === "left" ? (
            <IconHandStop className="h-3.5 w-3.5 scale-x-[-1] text-muted-foreground" />
          ) : (
            <IconHandStop className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-sm leading-none">
            {GESTURE_EMOJIS[mapping.gesture]}
          </span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
              size="icon"
              variant="ghost"
            >
              <IconSettings className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Configuration</h4>
                <p className="text-muted-foreground text-sm">
                  Configure the gesture mapping.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm">Hand</span>
                  <Select
                    onValueChange={(v: Hand) => handleChange("hand", v)}
                    value={mapping.hand}
                  >
                    <SelectTrigger className="col-span-2 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-sm">Gesture</span>
                  <Select
                    onValueChange={(v) => handleChange("gesture", v)}
                    value={mapping.gesture}
                  >
                    <SelectTrigger className="col-span-2 h-8">
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
                  <span className="text-sm">Mode</span>
                  <Select
                    onValueChange={(v: Mode) => handleChange("mode", v)}
                    value={mapping.mode}
                  >
                    <SelectTrigger className="col-span-2 h-8">
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
                  <span className="text-sm">Address</span>
                  <Input
                    className="col-span-2 h-8 font-mono text-xs"
                    readOnly
                    value={mapping.address}
                  />
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => deleteMapping(mapping.id)}
                size="sm"
                variant="destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete Mapping
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Visual */}
      <div className="flex flex-1 items-center justify-center py-2">
        <MappingMonitor mapping={mapping} />
      </div>

      {/* Footer: Address/Label */}
      <div className="flex items-center justify-center">
        <div className="w-full truncate text-center font-mono text-[10px] text-muted-foreground/70">
          {mapping.mode}
        </div>
      </div>
    </div>
  );
}

function MappingMonitor({ mapping }: { mapping: Mapping }) {
  const { handData, activeGesture } = useHandStore(
    useShallow((state) => ({
      handData: state[mapping.hand].gestureData[mapping.gesture],
      activeGesture: state[mapping.hand].gesture,
    }))
  );

  const isActive = activeGesture === mapping.gesture;
  // Use a damped value or direct value? Direct for now.
  const value = handData?.y ?? 0; // For fader
  const knobValue = handData?.rot ?? 0;

  if (mapping.mode === "trigger") {
    return (
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full border-4 transition-all duration-75",
          isActive
            ? "scale-95 border-primary bg-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.5)]"
            : "border-muted bg-muted/20"
        )}
      >
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
    // Fader: Vertical bar
    const percentage = Math.max(0, Math.min(100, value * 100));
    return (
      <div className="relative h-24 w-8 overflow-hidden rounded-full bg-secondary/50">
        <div
          className="absolute bottom-0 w-full rounded-b-full bg-primary transition-all duration-75"
          style={{ height: `${percentage}%` }}
        />
        {/* Thumb */}
        {/* <div
          className="absolute left-0 right-0 h-1 bg-white/50"
          style={{ bottom: `${percentage}%` }}
        /> */}
      </div>
    );
  }

  if (mapping.mode === "knob") {
    // Knob: Circular progress or rotation
    // -180 to 180 degrees approx
    const rotation = clamp(knobValue * 300 - 150, -150, 150);
    return (
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-secondary bg-secondary/20">
        {/* Indicator */}
        <div
          className="absolute h-full w-1 bg-primary/50 transition-transform duration-75"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="absolute top-1 h-3 w-full rounded-full bg-primary" />
        </div>

        {/* Center Cap */}
        <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-card font-mono text-[10px] shadow-sm">
          {knobValue.toFixed(1)}
        </div>
      </div>
    );
  }

  return null;
}
