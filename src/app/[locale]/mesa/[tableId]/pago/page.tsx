"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCartStore } from "@/store/cartStore";
import { CheckoutForm } from "@/components/customer/CheckoutForm";
import { MockCheckoutForm } from "@/components/customer/MockCheckoutForm";
import { formatCLP } from "@/lib/utils";
import { ArrowLeft, Loader2, Receipt } from "lucide-react";
import Link from "next/link";

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const isMockMode = !STRIPE_KEY || STRIPE_KEY.includes("YOUR_KEY");
const stripePromise = isMockMode ? null : loadStripe(STRIPE_KEY);

export default function PagoPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const router = useRouter();
  const { customerName, tableId: storeTableId, items, includeTip, getSubtotal, getTip, getTotal } = useCartStore();

  const [orderId, setOrderId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const tip = getTip();
  const total = getTotal();

  useEffect(() => {
    if (!customerName || storeTableId !== tableId || items.length === 0) {
      router.replace(`/mesa/${tableId}`);
      return;
    }

    const init = async () => {
      try {
        // Step 1: create order in DB
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId,
            customerName,
            includeTip,
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          }),
        });

        if (!orderRes.ok) {
          const data = await orderRes.json();
          throw new Error(data.error ?? "Error al crear pedido");
        }

        const order = await orderRes.json();
        setOrderId(order.id);

        // Step 2: if Stripe is configured, create a PaymentIntent
        if (!isMockMode) {
          const intentRes = await fetch("/api/payments/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id }),
          });

          if (!intentRes.ok) {
            const data = await intentRes.json();
            throw new Error(data.error ?? "Error al iniciar pago");
          }

          const { clientSecret } = await intentRes.json();
          setClientSecret(clientSecret);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-gray-600">Preparando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-3">⚠️</p>
          <h2 className="font-bold text-lg text-gray-900 mb-2">Hubo un problema</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link
            href={`/mesa/${tableId}/menu`}
            className="bg-amber-500 text-white font-semibold px-6 py-3 rounded-xl inline-block"
          >
            Volver a la carta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-amber-500 text-white px-4 pt-10 pb-4 flex items-center gap-3">
        <Link href={`/mesa/${tableId}/menu`} className="p-1 rounded-full hover:bg-amber-600">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Pagar pedido</h1>
          <p className="text-amber-100 text-sm">{customerName}</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Order summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-800">Resumen</h2>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} × {item.quantity}</span>
                <span className="font-medium">{formatCLP(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{formatCLP(subtotal)}</span>
            </div>
            {includeTip && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Propina (10%)</span>
                <span>+ {formatCLP(tip)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-amber-600">{formatCLP(total)}</span>
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Datos de pago</h2>

          {orderId && isMockMode && (
            <MockCheckoutForm total={total} tableId={tableId} orderId={orderId} />
          )}

          {orderId && !isMockMode && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: { colorPrimary: "#f59e0b", borderRadius: "12px" },
                },
              }}
            >
              <CheckoutForm total={total} tableId={tableId} orderId={orderId} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
