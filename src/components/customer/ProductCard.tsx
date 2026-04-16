"use client";

import { Plus, Minus } from "lucide-react";
import { formatCLP } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.productId === product.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="flex gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-amber-600">{formatCLP(product.price)}</span>
          {qty === 0 ? (
            <button
              onClick={() => addItem({ id: product.id, name: product.name, price: product.price })}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              <Plus size={14} />
              Agregar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, qty - 1)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="font-bold text-gray-900 w-4 text-center">{qty}</span>
              <button
                onClick={() => updateQuantity(product.id, qty + 1)}
                className="w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
