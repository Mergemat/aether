import { useAtom } from "jotai";
import { activeGesturesAtom } from "../atoms";

export const Header = () => {
  const [activeGestures] = useAtom(activeGesturesAtom);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-border border-b bg-card/50 px-6 py-4 backdrop-blur-xl">
      <h1 className="font-medium text-xl tracking-tighter">
        PHANTOM <span className="text-primary">8</span>
      </h1>
      <div className="flex gap-6">
        {(["left", "right"] as const).map((h) => (
          <div className="flex flex-col items-end" key={h}>
            <span className="font-medium text-xs uppercase tracking-widest opacity-50">
              {h}
            </span>
            <span className="font-medium text-primary text-xs">
              {activeGestures[h]}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
};
