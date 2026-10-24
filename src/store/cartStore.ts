"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartStore } from "@/types";
import { calcTip } from "@/lib/utils";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// sessionStorage: cada tab del navegador tiene su propio carrito aislado.
// Si el cliente abre dos tabs distintas (dos mesas distintas), no se mezclan.
// Esto también evita que el carrito de un cliente anterior persista en el
// dispositivo compartido del local (ej: tablet en la mesa).
const storage = typeof window !== "undefined"
  ? createJSONStorage(() => sessionStorage)
  : createJSONStorage(() => noopStorage);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tenantSlug: null,
      tableId: null,
      customerName: null,
      email: null as string | null,
      items: [],
      includeTip: true,
      tipPercent: 10,

      setSession: (tenantSlug, tableId, name, email?: string) => set({
        tenantSlug,
        tableId,
        customerName: name,
        email: email ?? null,
      }),

      addItem: (product) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          set({ items: items.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { productId: product.id, name: product.name, price: product.price, quantity: 1 }] });
        }
      },

      removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
        } else {
          set({ items: get().items.map((i) => i.productId === productId ? { ...i, quantity } : i) });
        }
      },

      setIncludeTip: (include) => set({ includeTip: include }),

      setTipPercent: (percent) => set({ tipPercent: percent }),

      clearCart: () => set({ items: [], tableId: null, customerName: null, email: null, tenantSlug: null }),

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((s, i) => s + i.price * i.quantity, 0);
      },

      getTip: () => {
        const { items, tipPercent, includeTip } = get();
        if (!includeTip) return 0;
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        return calcTip(subtotal, tipPercent);
      },

      getTotal: () => {
        const { items, includeTip, tipPercent } = get();
        const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const tip = includeTip ? calcTip(subtotal, tipPercent) : 0;
        return subtotal + tip;
      },
    }),
    {
      // v3: migrado de localStorage a sessionStorage (DT-6)
      // Al cambiar el nombre, los clientes con v2 en localStorage parten con carrito limpio
      name: "cart-storage-v3",
      storage,
    }
  )
);
