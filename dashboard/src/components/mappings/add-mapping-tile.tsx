import { IconPlus } from "@tabler/icons-react";
import { Button } from "../ui/button";

interface AddMappingTileProps {
  onClick: () => void;
}

export function AddMappingTile({ onClick }: AddMappingTileProps) {
  return (
    <Button
      className="group hover:bg flex aspect-square h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-muted-foreground/25 border-dashed outline-none"
      onClick={onClick}
      variant="outline"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shadow-sm transition-transform group-hover:scale-105">
        <IconPlus className="h-6 w-6 text-muted-foreground" />
      </div>
      Add Mapping
    </Button>
  );
}
