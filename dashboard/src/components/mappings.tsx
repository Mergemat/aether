import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useShallow } from "zustand/react/shallow";
import ButtonImage from "@/assets/Button.png";
import ButtonPressedImage from "@/assets/Button-Pressed.png";
import FaderImage from "@/assets/Fader.png";
import KnobImage from "@/assets/Knob.png";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GESTURE_EMOJIS, GESTURES } from "@/lib/constants";
import { clamp } from "@/lib/utils/clamp";
import perfLogger from "@/lib/utils/logger";
import { useHandStore } from "@/store/hand-store";
import { useMappingsStore } from "@/store/mappings-store";
import type { Hand, Mapping, Mode } from "@/types";

export function Mappings() {
  perfLogger.componentRender("Mappings");

  const mappings = useMappingsStore((state) => state.mappings);
  const addMapping = useMappingsStore((state) => state.addMapping);

  const onNewMapping = () => {
    addMapping({
      hand: "right",
      gesture: "Open_Palm",
      mode: "fader",
      enabled: true,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Hand Mappings</CardTitle>
          <CardDescription>Map gestures to OSC addresses.</CardDescription>
        </div>
        <Button onClick={onNewMapping} size="sm" variant="outline">
          <IconPlus className="mr-2 h-4 w-4" />
          Add Mapping
        </Button>
      </CardHeader>
      <CardContent className="flex gap-3 overflow-x-auto">
        {mappings.length === 0 ? (
          <div className="border-2 border-dashed py-10 text-center text-muted-foreground text-sm">
            No mappings configured.
          </div>
        ) : (
          mappings.map((mapping) => (
            <MappingRow key={mapping.id} mapping={mapping} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function MappingRow({ mapping }: { mapping: Mapping }) {
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
    <div className="group flex h-fit flex-col items-center gap-3 border bg-card p-3 transition-all hover:shadow-sm">
      <Select
        onValueChange={(v: Mode) => handleChange("mode", v)}
        value={mapping.mode}
      >
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="trigger">Trigger</SelectItem>
          <SelectItem value="fader">Fader</SelectItem>
          <SelectItem value="knob">Knob</SelectItem>
        </SelectContent>
      </Select>

      <MappingMonitor mapping={mapping} />

      <div className="flex flex-col items-center gap-2">
        <div className="flex w-full items-center justify-between">
          <Select
            onValueChange={(v) => handleChange("gesture", v)}
            value={mapping.gesture}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GESTURES.map((g) => (
                <SelectItem className="text-sm" key={g} value={g}>
                  {GESTURE_EMOJIS[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v: Hand) => handleChange("hand", v)}
            value={mapping.hand}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          className="h-8 w-36 flex-1 font-mono text-xs"
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="/osc/address"
          readOnly
          value={mapping.address}
        />

        <Switch
          checked={mapping.enabled}
          onCheckedChange={(v) => handleChange("enabled", v)}
        />

        <Button
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => deleteMapping(mapping.id)}
          size="icon"
          variant="ghost"
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function MappingMonitor({ mapping }: { mapping: Mapping }) {
  // Combined selector with shallow comparison - single subscription instead of two
  const { handData, activeGesture } = useHandStore(
    useShallow((state) => ({
      handData: state[mapping.hand].gestureData[mapping.gesture],
      activeGesture: state[mapping.hand].gesture,
    }))
  );

  const isActive = activeGesture === mapping.gesture;
  const faderValue = handData?.y ?? 0;
  const knobValue = handData?.rot ?? 0;
  const knobRotation = clamp(knobValue * 330 - 180, -150, 180);

  return (
    <div className="flex w-36 flex-col items-center gap-2 px-3 py-3 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
      <div className="flex flex-col items-center justify-center">
        {mapping.mode === "trigger" && (
          <div className="flex flex-col items-center gap-2">
            <img
              alt="Button"
              className="h-16 w-auto transition-all duration-75"
              src={isActive ? ButtonPressedImage : ButtonImage}
            />
            <span className={`tabular-nums ${isActive ? "text-primary" : ""}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        )}

        {mapping.mode === "fader" && (
          <div className="relative flex flex-col items-center gap-2">
            {/* Fader track container */}
            <div className="relative flex h-72 w-8 items-center justify-center overflow-hidden rounded">
              <div className="absolute h-[90%] w-4 bg-black/20" />
              {/* Fader knob image - moves vertically based on value */}
              <img
                alt="Fader"
                className="absolute w-12 transition-all duration-75"
                src={FaderImage}
                style={{
                  bottom: `${faderValue * 80}%`,
                }}
              />
            </div>
            <span className="tabular-nums">{faderValue.toFixed(2)}</span>
          </div>
        )}

        {mapping.mode === "knob" && (
          <div className="flex flex-col items-center gap-2">
            <img
              alt="Knob"
              className="h-16 w-auto transition-transform duration-75"
              src={KnobImage}
              style={{
                transform: `rotate(${knobRotation}deg)`,
              }}
            />
            <span className="tabular-nums">{knobValue.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
