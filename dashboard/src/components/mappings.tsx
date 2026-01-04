import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { useEffect, useMemo } from "react";
import { useMappingsOrderStore } from "@/store/mappings-order-store";
import { useMappingsStore } from "@/store/mappings-store";
import type { Mapping } from "@/types";
import { AddMappingTile } from "./mappings/add-mapping-tile";
import { SortableMappingTile } from "./mappings/sortable-mapping-tile";
import { Separator } from "./ui/separator";

export function Mappings() {
  const mappings = useMappingsStore((state) => state.mappings);
  const addMapping = useMappingsStore((state) => state.addMapping);

  const order = useMappingsOrderStore((state) => state.order);
  const setOrder = useMappingsOrderStore((state) => state.setOrder);

  // Sync order with mappings - add new ids, remove deleted ones
  useEffect(() => {
    const mappingIds = new Set(mappings.map((m) => m.id));
    const orderSet = new Set(order);

    // Find new ids not in order
    const newIds = mappings.filter((m) => !orderSet.has(m.id)).map((m) => m.id);
    // Filter out ids that no longer exist
    const validOrder = order.filter((id) => mappingIds.has(id));

    if (newIds.length > 0 || validOrder.length !== order.length) {
      setOrder([...validOrder, ...newIds]);
    }
  }, [mappings, order, setOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const onNewMapping = () => {
    addMapping({
      hand: "right",
      gesture: "Open_Palm",
      mode: "trigger",
      enabled: true,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over.id as string);
      setOrder(arrayMove(order, oldIndex, newIndex));
    }
  };

  // Build ordered mappings from order array
  const orderedMappings = useMemo(() => {
    const mappingsMap = new Map(mappings.map((m) => [m.id, m]));
    return order.map((id) => mappingsMap.get(id)).filter(Boolean) as Mapping[];
  }, [mappings, order]);

  return (
    <div className="flex flex-col gap-4">
      <Separator />

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {orderedMappings.map((mapping) => (
              <SortableMappingTile key={mapping.id} mapping={mapping} />
            ))}
            <AddMappingTile onClick={onNewMapping} />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
