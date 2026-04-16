"use client";

import { use, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function GraciasContent({ tableId }: { tableId: string }) {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={52} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago exitoso!</h1>
        <p className="text-gray-500 mb-2">
          Tu pedido fue recibido. En breve el equipo comenzará a prepararlo.
        </p>
        {orderId && (
          <p className="text-xs text-gray-400 mb-8 font-mono">
            Pedido #{orderId.slice(-8).toUpperCase()}
          </p>
        )}

        <Link
          href={`/mesa/${tableId}`}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl inline-block transition-colors"
        >
          Nuevo pedido
        </Link>
      </div>
    </div>
  );
}

export default function GraciasPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Cargando...</div>
      </div>
    }>
      <GraciasContent tableId={tableId} />
    </Suspense>
  );
}
