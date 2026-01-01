import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MappingsOrderState {
  order: string[];
  setOrder: (order: string[]) => void;
  addId: (id: string) => void;
  removeId: (id: string) => void;
}

export const useMappingsOrderStore = create<MappingsOrderState>()(
  persist(
    (set, get) => ({
      order: [],

      setOrder: (order: string[]) => {
        set({ order });
      },

      addId: (id: string) => {
        const order = get().order;
        if (!order.includes(id)) {
          set({ order: [...order, id] });
        }
      },

      removeId: (id: string) => {
        const order = get().order;
        set({ order: order.filter((i) => i !== id) });
      },
    }),
    {
      name: "aether:mappings-order",
    }
  )
);
