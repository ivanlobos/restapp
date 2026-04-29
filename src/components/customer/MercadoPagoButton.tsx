"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { formatCLP } from "@/lib/utils";

interface Props {
  total: number;
  tableId: string;
  orderId: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
}

export function MercadoPagoButton({ total, tableId, orderId, items }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId,
          items: items.map((i) => ({
            id: i.productId,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear preferencia");
      window.location.href = data.init_point;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Redirigiendo...
          </>
        ) : (
          `Pagar con Mercado Pago ${formatCLP(total)}`
        )}
      </button>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
