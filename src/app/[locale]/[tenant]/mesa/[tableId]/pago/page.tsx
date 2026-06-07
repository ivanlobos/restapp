"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatCLP } from "@/lib/utils";
import { ArrowLeft, Loader2, Receipt } from "lucide-react";
import Link from "next/link";
import { MercadoPagoButton } from "@/components/customer/MercadoPagoButton";

type DeliveryPreference = "DRINKS_FIRST" | "TOGETHER" | null;

export default function PagoPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);
  const router = useRouter();
  const routeParams = useParams();
  const locale = (routeParams?.locale as string) ?? "es";
  const tenantSlug = (routeParams?.tenant as string) ?? "";

  const {
    customerName,
    email,
    tableId: storeTableId,
    tenantSlug: storeTenantSlug,
    items,
    includeTip,
    tipPercent,
    getSubtotal,
    getTip,
    getTotal,
  } = useCartStore();

  const initRan = useRef(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [deliveryPreference, setDeliveryPreference] = useState<DeliveryPreference>(null);

  const subtotal = getSubtotal();
  const tip = getTip();
  const total = getTotal();

  const shouldShowModal = items.length > 0;

  useEffect(() => {
    if (!customerName || storeTableId !== tableId || storeTenantSlug !== tenantSlug || items.length === 0) {
      router.replace(`/${locale}/${tenantSlug}/mesa/${tableId}`);
      return;
    }
    if (shouldShowModal) {
      setShowModal(true);
    } else {
      createOrder(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createOrder = async (preference: DeliveryPreference) => {
    if (initRan.current) return;
    initRan.current = true;
    setLoading(true);
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          tableId,
          customerName,
          email: email ?? undefined,
          includeTip,
          tipPercent,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          deliveryPreference: preference,
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error ?? "Error al crear pedido");
      }

      const order = await orderRes.json();
      setOrderId(order.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceSelect = (preference: DeliveryPreference) => {
    setDeliveryPreference(preference);
    setShowModal(false);
    createOrder(preference);
  };

  if (showModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
          <div className="text-center mb-6">
            <p className="text-4xl mb-3">🍺🍽️</p>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              ¿Cómo prefieres recibir tu pedido?
            </h2>
            <p className="text-sm text-gray-500">
              Tienes bebestibles y comida en tu pedido
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => handlePreferenceSelect("DRINKS_FIRST")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
            >
              <span className="text-2xl">🍺</span>
              <div>
                <p className="font-semibold text-gray-900">Bebestible primero</p>
                <p className="text-xs text-gray-500">Recibo el trago mientras espero la comida</p>
              </div>
            </button>
            <button
              onClick={() => handlePreferenceSelect("TOGETHER")}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
            >
              <span className="text-2xl">🍽️</span>
              <div>
                <p className="font-semibold text-gray-900">Todo junto</p>
                <p className="text-xs text-gray-500">Prefiero recibir todo al mismo tiempo</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            href={`/${locale}/${tenantSlug}/mesa/${tableId}/menu`}
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
        <Link href={`/${locale}/${tenantSlug}/mesa/${tableId}/menu`} className="p-1 rounded-full hover:bg-amber-600">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="text-lg font-bold">Pagar pedido</h1>
          <p className="text-amber-100 text-sm">{customerName}</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {deliveryPreference && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">{deliveryPreference === "DRINKS_FIRST" ? "🍺" : "🍽️"}</span>
            <p className="text-sm text-amber-800 font-medium">
              {deliveryPreference === "DRINKS_FIRST"
                ? "Recibirás tu bebestible primero"
                : "Recibirás todo junto"}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-800">Resumen</h2>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity} × {item.name}</span>
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
                <span>Propina ({tipPercent}%)</span>
                <span>+ {formatCLP(tip)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-amber-600">{formatCLP(total)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Datos de pago</h2>
          {orderId && (
            <MercadoPagoButton
              total={total}
              orderId={orderId}
              tenantSlug={tenantSlug}
            />
          )}
        </div>
      </div>
    </div>
  );
}