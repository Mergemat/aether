import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MappingsOrderState {
  addId: (id: string) => void;
  order: string[];
  removeId: (id: string) => void;
  setOrder: (order: string[]) => void;
}

export const useMappingsOrderStore = create<MappingsOrderState>()(
  persist(
    (set, get) => ({
      order: [],

      setOrder: (order: string[]) => {
        set({ order });
      },

      addId: (id: string) => {
        const { order } = get();
        if (!order.includes(id)) {
          set({ order: [...order, id] });
        }
      },

      removeId: (id: string) => {
        const { order } = get();
        set({ order: order.filter((i) => i !== id) });
      },
    }),
    {
      name: "aether:mappings-order",
    }
  )
);
