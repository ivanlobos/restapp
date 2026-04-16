"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { formatCLP } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CheckoutFormProps {
  total: number;
  tableId: string;
  orderId: string;
}

export function CheckoutForm({ total, tableId, orderId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/mesa/${tableId}/gracias?order=${orderId}`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Error al procesar el pago");
      setLoading(false);
    }
    // On success, Stripe redirects to return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Procesando...
          </>
        ) : (
          `Pagar ${formatCLP(total)}`
        )}
      </button>
    </form>
  );
}
