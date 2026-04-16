"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatCLP } from "@/lib/utils";

interface CartDrawerProps {
  tableId?: string;
}

export function CartDrawer({ tableId: propTableId }: CartDrawerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { items, updateQuantity, removeItem, includeTip, setIncludeTip, getSubtotal, getTip, getTotal, tableId: storeTableId } = useCartStore();
  const tableId = storeTableId ?? propTableId;

  const subtotal = getSubtotal();
  const tip = getTip();
  const total = getTotal();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  if (itemCount === 0 && !open) {
    return null;
  }

  return (
    <>
      {/* Floating cart button */}
      {!open && itemCount > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-4 z-40 bg-amber-500 text-white rounded-full px-5 py-3 flex items-center gap-2 shadow-lg font-semibold"
        >
          <ShoppingCart size={20} />
          <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
          <span className="ml-1 font-bold">{formatCLP(total)}</span>
        </button>
      )}

      {/* Drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 max-h-[85vh] flex flex-col ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Tu pedido</h2>
          <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCLP(item.price)} c/u</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Minus size={13} />
                </button>
                <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center"
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="w-7 h-7 rounded-full text-red-400 hover:bg-red-50 flex items-center justify-center ml-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <span className="font-semibold text-sm w-20 text-right">
                {formatCLP(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-4 border-t space-y-2 bg-gray-50">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCLP(subtotal)}</span>
          </div>

          {/* Tip toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg border border-amber-100">
            <div>
              <p className="text-sm font-medium text-gray-800">Propina sugerida (10%)</p>
              <p className="text-xs text-gray-500">{formatCLP(Math.round(subtotal * 0.1))}</p>
            </div>
            <button
              onClick={() => setIncludeTip(!includeTip)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                includeTip ? "bg-amber-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  includeTip ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {includeTip && (
            <div className="flex justify-between text-sm text-amber-600">
              <span>Propina</span>
              <span>+ {formatCLP(tip)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
            <span>Total a pagar</span>
            <span className="text-amber-600">{formatCLP(total)}</span>
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push(`/mesa/${tableId}/pago`);
            }}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors mt-2"
          >
            Proceder al pago
          </button>
        </div>
      </div>
    </>
  );
}
