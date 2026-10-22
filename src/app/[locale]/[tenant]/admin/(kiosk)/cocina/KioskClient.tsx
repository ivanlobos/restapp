"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatCLP } from "@/lib/utils";
import { CheckCircle2, Circle, ChefHat, LogOut } from "lucide-react";

interface Product { id: string; name: string; }
interface OrderItem { id: string; quantity: number; subtotal: number; product: Product; }
interface Table { id: string; number: number; label?: string | null; }
interface Order {
  id: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  table: Table;
  items: OrderItem[];
}

const statusLabel: Record<string, string> = {
  PENDING: "Nuevo",
  PROCESSING: "Confirmado",
  PAID: "Pagado",
  PREPARING: "Preparando",
  DELIVERED: "Entregado",
};

const statusBg: Record<string, string> = {
  PENDING: "bg-yellow-500",
  PROCESSING: "bg-blue-500",
  PAID: "bg-green-500",
  PREPARING: "bg-orange-500",
  DELIVERED: "bg-gray-500",
};

const nextStatus: Record<string, string | null> = {
  PENDING: "PROCESSING",
  PROCESSING: "PREPARING",
  PAID: "PREPARING",
  PREPARING: "DELIVERED",
  DELIVERED: null,
};

const nextStatusLabel: Record<string, string> = {
  PENDING: "Confirmar",
  PROCESSING: "Preparar",
  PAID: "Preparar",
  PREPARING: "Entregado",
};

type View = "login" | "orders";

export function KioskClient({ area }: { area: "KITCHEN" | "BAR" }) {
  const params = useParams();
  const tenantSlug = params?.tenant as string;

  const [view, setView] = useState<View>("login");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveredItems, setDeliveredItems] = useState<Record<string, Set<string>>>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const username = area === "KITCHEN" ? "cocina" : "bar";
  const areaLabel = area === "KITCHEN" ? "🍳 Cocina" : "🍺 Bar";

  // Fetch orders filtrados por área
  const fetchOrders = useCallback(async () => {
    const res = await fetch(
      `/api/orders/kiosk?tenantSlug=${tenantSlug}&area=${area}`
    );
    if (res.ok) {
      setOrders(await res.json());
      setLastRefresh(new Date());
    }
  }, [tenantSlug, area]);

  useEffect(() => {
    if (view !== "orders") return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [view, fetchOrders]);

  // Login con PIN
  const handlePinPress = async (digit: string) => {
    if (digit === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length >= 4) {
      setLoginLoading(true);
      setLoginError("");
      try {
        const res = await fetch("/api/admin/login-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantSlug, username, pin: newPin }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setView("orders");
          setPin("");
        } else {
          setLoginError("PIN incorrecto");
          setPin("");
        }
      } finally {
        setLoginLoading(false);
      }
    }
  };

  const handleAdvance = async (orderId: string, status: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, tenantSlug }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, status: updated.status } : o));
      if (status === "DELIVERED") {
        setDeliveredItems((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
        setTimeout(() => setOrders((prev) => prev.filter((o) => o.id !== orderId)), 1500);
      }
    }
  };

  const toggleItem = (orderId: string, itemId: string) => {
    setDeliveredItems((prev) => {
      const current = new Set(prev[orderId] ?? []);
      current.has(itemId) ? current.delete(itemId) : current.add(itemId);
      return { ...prev, [orderId]: current };
    });
  };

  const allDelivered = (order: Order) => {
    if (!order.items.length) return true;
    const d = deliveredItems[order.id];
    return !!d && order.items.every((i) => d.has(i.id));
  };

  // ── LOGIN VIEW ──────────────────────────────────────────────
  if (view === "login") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 p-6">
        <div className="mb-8 text-center">
          <ChefHat size={48} className="mx-auto mb-3 text-orange-400" />
          <h1 className="text-2xl font-bold text-white">{areaLabel}</h1>
          <p className="text-gray-400 text-sm mt-1">Ingresa tu PIN para acceder</p>
        </div>

        {/* PIN dots */}
        <div className="flex gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < pin.length ? "bg-orange-400" : "bg-gray-700"
              }`}
            />
          ))}
        </div>

        {loginError && (
          <p className="text-red-400 text-sm mb-4 animate-pulse">{loginError}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-64">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
            <button
              key={i}
              onClick={() => d && handlePinPress(d)}
              disabled={!d || loginLoading}
              className={`h-16 rounded-2xl text-xl font-bold transition-colors ${
                d === "⌫"
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : d
                  ? "bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-600"
                  : ""
              } ${!d ? "pointer-events-none" : ""}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── ORDERS VIEW ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">{areaLabel} — Pedidos activos</h1>
          <p className="text-gray-500 text-xs">
            {lastRefresh ? `Actualizado ${lastRefresh.toLocaleTimeString("es-CL")}` : "Cargando..."}
          </p>
        </div>
        <button
          onClick={() => setView("login")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-600">
          <p className="text-5xl mb-3">✅</p>
          <p>Sin pedidos pendientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {orders.map((order) => {
            const isPreparing = order.status === "PREPARING";
            const delivered = deliveredItems[order.id] ?? new Set();
            const allDone = allDelivered(order);

            return (
              <div
                key={order.id}
                className="bg-gray-900 rounded-2xl p-4 border border-gray-800"
              >
                {/* Header card */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white text-lg">{order.customerName}</p>
                    <p className="text-gray-400 text-sm">
                      Mesa {order.table.number}
                      {order.table.label ? ` · ${order.table.label}` : ""} ·{" "}
                      {new Date(order.createdAt).toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold text-white ${statusBg[order.status] ?? "bg-gray-600"}`}>
                    {statusLabel[order.status]}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => {
                    const isDone = delivered.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => isPreparing && toggleItem(order.id, item.id)}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                          isPreparing ? "cursor-pointer hover:bg-gray-800" : ""
                        } ${isDone ? "opacity-40" : ""}`}
                      >
                        {isPreparing && (
                          isDone
                            ? <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                            : <Circle size={20} className="text-gray-600 shrink-0" />
                        )}
                        <span className={`text-base flex-1 ${isDone ? "line-through text-gray-500" : "text-white"}`}>
                          <span className="font-bold text-orange-400">{item.quantity}×</span>{" "}
                          {item.product.name}
                        </span>
                        <span className="text-gray-500 text-sm">{formatCLP(item.subtotal)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Action */}
                {nextStatus[order.status] && (
                  <button
                    onClick={() => handleAdvance(order.id, nextStatus[order.status]!)}
                    disabled={isPreparing && !allDone}
                    className={`w-full py-3 rounded-xl font-bold text-base transition-colors ${
                      isPreparing && !allDone
                        ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-400 text-white"
                    }`}
                  >
                    {isPreparing && !allDone
                      ? `Faltan ${order.items.length - delivered.size} ítems`
                      : nextStatusLabel[order.status]}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
