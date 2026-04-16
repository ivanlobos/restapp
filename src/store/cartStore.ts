"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartStore } from "@/types";
import { calcTip } from "@/lib/utils";

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tableId: null,
      customerName: null,
      items: [],
      includeTip: true,

      setSession: (tableId, name) => set({ tableId, customerName: name }),

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
              },
            ],
          });
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
      },

      setIncludeTip: (include) => set({ includeTip: include }),

      clearCart: () => set({ items: [], includeTip: true }),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getTip: () => {
        const subtotal = get().getSubtotal();
        return get().includeTip ? calcTip(subtotal) : 0;
      },

      getTotal: () => get().getSubtotal() + get().getTip(),
    }),
    {
      name: "restaurant-cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : localStorage
      ),
    }
  )
);
