import { IconPlus } from "@tabler/icons-react";
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
      <CardContent className="grid grid-cols-2 gap-3 overflow-x-auto md:grid-cols-6 md:grid-rows-2">
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
  const { updateMapping } = useMappingsStore(
    useShallow((state) => ({
      updateMapping: state.updateMapping,
    }))
  );

  const handleChange = (name: keyof Mapping, value: string | boolean) => {
    updateMapping(mapping.id, { [name]: value });
  };

  return (
    <div
      className={cn(
        "group flex flex-col items-center justify-between gap-3 border bg-card p-3 hover:shadow-sm md:flex-col",
        mapping.mode === "fader" ? "col-span-2 md:col-span-1 md:row-span-2" : ""
      )}
    >
      <div className="flex w-full flex-row items-center justify-between gap-2">
        <Select
          onValueChange={(v) => handleChange("gesture", v)}
          value={mapping.gesture}
        >
          <SelectTrigger className="h-8 w-20 text-sm">
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

      <MappingMonitor mapping={mapping} />

      <div className="flex w-full items-center justify-between gap-2">
        <Select
          onValueChange={(v: Mode) => handleChange("mode", v)}
          value={mapping.mode}
        >
          <SelectTrigger className="h-8 w-20 text-xs md:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trigger">Trigger</SelectItem>
            <SelectItem value="fader">Fader</SelectItem>
            <SelectItem value="knob">Knob</SelectItem>
          </SelectContent>
        </Select>

        <Input
          className="h-8 w-20 flex-1 font-mono text-xs md:w-36"
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="/osc/address"
          readOnly
          value={mapping.address}
        />

        {/* <Switch */}
        {/*   checked={mapping.enabled} */}
        {/*   onCheckedChange={(v) => handleChange("enabled", v)} */}
        {/* /> */}
        {/**/}
        {/* <Button */}
        {/*   className="h-8 w-8 text-muted-foreground hover:text-destructive" */}
        {/*   onClick={() => deleteMapping(mapping.id)} */}
        {/*   size="icon" */}
        {/*   variant="ghost" */}
        {/* > */}
        {/*   <IconTrash className="h-4 w-4" /> */}
        {/* </Button> */}
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
    <div className="flex flex-col items-center gap-2 px-3 py-3 font-medium text-[10px] text-muted-foreground uppercase tracking-wider md:w-36">
      <div className="flex flex-col items-center justify-center">
        {mapping.mode === "trigger" && (
          <div className="flex flex-col items-center gap-2">
            <img
              alt="Button"
              className="h-16 w-auto duration-75"
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
            <div className="relative flex h-12 w-72 items-center justify-center overflow-hidden rounded md:h-72 md:w-8">
              <div className="absolute h-4 w-[90%] bg-black/20 md:h-[90%] md:w-4" />
              {/* Fader knob image - moves vertically based on value */}
              <img
                alt="Fader"
                className="absolute h-12 rotate-90 duration-75 md:h-auto md:w-12 md:rotate-0"
                src={FaderImage}
                style={{
                  left: `${faderValue * 80}%`,
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
              className="h-16 w-auto duration-75"
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
