import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Mapping } from "@/types";
import { MappingTile } from "./mapping-tile";

export function SortableMappingTile({ mapping }: { mapping: Mapping }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mapping.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <div
      className="aspect-square"
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <MappingTile
        dragHandleProps={{ ref: setActivatorNodeRef, ...listeners }}
        mapping={mapping}
      />
    </div>
  );
}
