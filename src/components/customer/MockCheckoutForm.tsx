"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCLP } from "@/lib/utils";
import { CreditCard, Lock, Loader2 } from "lucide-react";

interface MockCheckoutFormProps {
  total: number;
  tableId: string;
  orderId: string;
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export function MockCheckoutForm({ total, tableId, orderId }: MockCheckoutFormProps) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    name.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al procesar el pago");
      }

      router.push(`/mesa/${tableId}/gracias?order=${orderId}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mock mode notice */}
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <span className="text-blue-500 text-xs font-bold uppercase tracking-wide">Modo prueba</span>
        <span className="text-blue-600 text-xs">— Ingresa cualquier dato para simular el pago</span>
      </div>

      {/* Card number */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Número de tarjeta</label>
        <div className="relative">
          <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono tracking-wider"
          />
        </div>
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Vencimiento</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">CVV</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
          />
        </div>
      </div>

      {/* Cardholder name */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre en la tarjeta</label>
        <input
          type="text"
          placeholder="JUAN PÉREZ"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase tracking-wide"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!isComplete || loading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Lock size={18} />
            Pagar {formatCLP(total)}
          </>
        )}
      </button>
    </form>
  );
}
