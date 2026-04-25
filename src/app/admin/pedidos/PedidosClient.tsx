"use client";

import { useEffect, useState } from "react";
import { formatCLP } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface Product { id: string; name: string; }
interface OrderItem { id: string; quantity: number; unitPrice: number; subtotal: number; product: Product; }
interface Table { id: string; number: number; label?: string | null; }
interface Order {
  id: string;
  customerName: string;
  status: string;
  subtotal: number;
  tipAmount: number;
  total: number;
  includeTip: boolean;
  createdAt: string;
  table: Table;
  items: OrderItem[];
}

const STATUSES = ["PENDING", "PROCESSING", "PAID", "PREPARING", "DELIVERED"] as const;

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "En proceso",
  PAID: "Pagado",
  PREPARING: "Preparando",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusColor: Record<string, string> = {
  PENDING: "border-yellow-300 bg-yellow-50",
  PROCESSING: "border-blue-300 bg-blue-50",
  PAID: "border-green-300 bg-green-50",
  PREPARING: "border-orange-300 bg-orange-50",
  DELIVERED: "border-gray-300 bg-gray-50",
};

const badgeColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  PREPARING: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-gray-100 text-gray-600",
};

const nextStatus: Record<string, string | null> = {
  PENDING: "PROCESSING",
  PROCESSING: "PREPARING",
  PAID: "PREPARING",
  PREPARING: "DELIVERED",
  DELIVERED: null,
};

const nextStatusLabel: Record<string, string> = {
  PENDING: "Confirmar pedido",
  PROCESSING: "Comenzar a preparar",
  PAID: "Comenzar a preparar",
  PREPARING: "Marcar como entregado",
};


export function PedidosClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/orders?status=PENDING,PROCESSING,PAID,PREPARING");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setLastRefresh(new Date());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = async (orderId: string, status: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      if (status === "DELIVERED") {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      }
    }
  };

  const activeStatuses = STATUSES.filter((s) => s !== "DELIVERED");

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos activos</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Actualizado: {lastRefresh.toLocaleTimeString("es-CL")} · Auto-refresh cada 5s
          </p>
        </div>
        <button
          onClick={async () => {
            const res = await fetch("/api/orders?status=PENDING,PROCESSING,PAID,PREPARING");
            if (res.ok) { setOrders(await res.json()); setLastRefresh(new Date()); }
          }}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p>No hay pedidos activos en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-2xl p-4 border-2 shadow-sm transition-colors ${statusColor[order.status] ?? "border-gray-200 bg-white"}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">{order.customerName}</p>
                  <p className="text-gray-500 text-xs">
                    Mesa {order.table.number}{order.table.label ? ` · ${order.table.label}` : ""} ·{" "}
                    {new Date(order.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeColor[order.status] ?? ""}`}>
                  {statusLabel[order.status]}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-1 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.quantity}× {item.product.name}</span>
                    <span className="text-gray-500">{formatCLP(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-current border-opacity-20 pt-2 space-y-0.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtotal</span><span>{formatCLP(order.subtotal)}</span>
                </div>
                {order.includeTip && (
                  <div className="flex justify-between text-xs text-amber-600">
                    <span>Propina</span><span>+ {formatCLP(order.tipAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm">
                  <span>Total</span><span>{formatCLP(order.total)}</span>
                </div>
              </div>

              {/* Action button */}
              {nextStatus[order.status] && (
                <button
                  onClick={() => handleAdvance(order.id, nextStatus[order.status]!)}
                  className="mt-3 w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm py-2 rounded-xl transition-colors"
                >
                  {nextStatusLabel[order.status]}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
