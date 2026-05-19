'use client';

import { useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { formatCLP } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';

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
  const [isOpen, setIsOpen] = useState(false);
  const [modalQty, setModalQty] = useState(1);

  const openModal = () => {
    setModalQty(qty > 0 ? qty : 1);
    setIsOpen(true);
  };
  const closeModal = () => setIsOpen(false);

  const handleAddFromModal = () => {
    if (qty === 0) {
      addItem({ id: product.id, name: product.name, price: product.price });
      if (modalQty > 1) updateQuantity(product.id, modalQty);
    } else {
      updateQuantity(product.id, modalQty);
    }
    closeModal();
  };

  return (
    <>
      <div
        onClick={openModal}
        className="flex gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-amber-50 flex items-center justify-center text-3xl">
            🍽️
          </div>
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
                onClick={(e) => {
                  e.stopPropagation();
                  addItem({ id: product.id, name: product.name, price: product.price });
                }}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                <Plus size={14} />
                Agregar
              </button>
            ) : (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-amber-50 flex items-center justify-center text-7xl">🍽️</div>
              )}
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-2xl font-bold text-amber-600 mt-1">{formatCLP(product.price)}</p>
              {product.description && (
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">{product.description}</p>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-700">Cantidad</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-lg w-6 text-center">{modalQty}</span>
                  <button
                    onClick={() => setModalQty(modalQty + 1)}
                    className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={handleAddFromModal}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                {qty > 0 ? 'Actualizar' : 'Agregar'} · {formatCLP(product.price * modalQty)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
