import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";
import { useEngineStatus } from "@/store/engine-status-store";

// Leaves room for the inset traffic lights (see titleBarStyle in main.ts)
const isMac = window.electronAPI?.platform === "darwin";

export function TitleBar() {
  const connected = useEngineStatus((state) => state.connected);
  const fps = useEngineStatus((state) => state.fps);

  return (
    <header
      className={cn(
        "flex h-11 shrink-0 select-none items-center justify-between gap-4 pr-4 [-webkit-app-region:drag]",
        isMac ? "pl-20" : "pl-4"
      )}
    >
      <div className="flex items-center gap-2">
        <img alt="" className="size-3.5" height={14} src={logo} width={14} />
        <span className="silkscreen text-print">Aether</span>
      </div>

      <div className="flex items-center gap-4 font-mono text-[11px] text-print-dim tabular-nums">
        <span>{fps} fps</span>
        <span
          className="flex items-center gap-2"
          title={
            connected
              ? "Sending OSC to 127.0.0.1:7099"
              : "Can't reach the OSC bridge on port 8888"
          }
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              connected ? "bg-led" : "bg-[#3a3b3f]"
            )}
          />
          {connected ? "OSC 7099" : "Bridge offline"}
        </span>
      </div>
    </header>
  );
}
