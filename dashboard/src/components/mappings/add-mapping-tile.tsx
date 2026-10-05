import { IconPlus } from "@tabler/icons-react";

interface AddMappingTileProps {
  onClick: () => void;
}

/** The empty slot at the end of the panel */
export function AddMappingTile({ onClick }: AddMappingTileProps) {
  return (
    <button
      className="-mt-px -ml-px flex h-60 flex-col items-center justify-center gap-2 border border-line bg-panel text-print-dim transition-colors hover:bg-panel-raised hover:text-print focus-visible:outline-2 focus-visible:outline-print-dim focus-visible:-outline-offset-2"
      onClick={onClick}
      type="button"
    >
      <IconPlus className="size-4" stroke={1.5} />
      <span className="silkscreen">Add control</span>
    </button>
  );
}
