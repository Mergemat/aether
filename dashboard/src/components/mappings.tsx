import { IconActivity, IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GESTURES } from "@/lib/constants";
import { clamp } from "@/lib/utils/clamp";
import perfLogger from "@/lib/utils/logger";
import { useHandStore } from "@/store/hand-store";
import { useMappingsStore } from "@/store/mappings-store";
import type { Hand, Mapping, Mode } from "@/types";

export function Mappings() {
  perfLogger.componentRender("Mappings");

  const { mappings, addMapping } = useMappingsStore();

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
      <CardContent className="flex flex-col gap-3">
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
  const updateMapping = useMappingsStore((state) => state.updateMapping);
  const deleteMapping = useMappingsStore((state) => state.deleteMapping);

  const handleChange = (name: keyof Mapping, value: any) => {
    updateMapping(mapping.id, { [name]: value });
  };

  return (
    <div className="group flex flex-col gap-3 border bg-card p-3 transition-all hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          onValueChange={(v: Hand) => handleChange("hand", v)}
          value={mapping.hand}
        >
          <SelectTrigger className="h-8 w-[90px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) => handleChange("gesture", v)}
          value={mapping.gesture}
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GESTURES.map((g) => (
              <SelectItem key={g} value={g}>
                {g.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v: Mode) => handleChange("mode", v)}
          value={mapping.mode}
        >
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trigger">Trigger</SelectItem>
            <SelectItem value="fader">Fader</SelectItem>
            <SelectItem value="knob">Knob</SelectItem>
          </SelectContent>
        </Select>

        <Input
          className="h-8 min-w-[140px] flex-1 font-mono text-xs"
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
      <MappingMonitor mapping={mapping} />
    </div>
  );
}

function MappingMonitor({ mapping }: { mapping: Mapping }) {
  const handData = useHandStore(
    (state) => state[mapping.hand].gestureData[mapping.gesture]
  );

  const activeGesture = useHandStore((state) => state[mapping.hand].gesture);

  const isActive = activeGesture === mapping.gesture;

  return (
    <div className="flex items-center gap-3 bg-muted/40 px-3 py-2 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
      <div className="flex items-center gap-1.5">
        <IconActivity className={`h-3 w-3 ${isActive ? "text-primary" : ""}`} />
        Monitor
      </div>

      <div className="flex h-4 flex-1 items-center">
        <div className="flex w-full items-center gap-4">
          {mapping.mode === "trigger" && (
            <span className="flex animate-pulse items-center gap-1.5 text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Trigger Sent
            </span>
          )}

          {mapping.mode === "fader" && (
            <div className="flex flex-1 items-center gap-2">
              <Progress className="h-1.5" value={handData?.y * 100} />
              <span className="w-8 tabular-nums">{handData?.y.toFixed(2)}</span>
            </div>
          )}

          {mapping.mode === "knob" && (
            <div className="flex items-center gap-3">
              <div className="relative h-4 w-4 rounded-full border-2 border-primary/30">
                <div
                  className="absolute top-0 left-1/2 h-1/2 w-0.5 origin-bottom bg-primary"
                  style={{
                    transform: `translateX(-50%) rotate(${clamp(
                      handData?.rot * 330 - 180,
                      -150,
                      180
                    )}deg)`,
                  }}
                />
              </div>
              <span className="tabular-nums">{handData?.rot.toFixed(2)}</span>
            </div>
          )}
        </div>
        )
      </div>
    </div>
  );
}
