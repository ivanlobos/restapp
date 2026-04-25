"use client";

import { useState } from "react";
import { formatCLP } from "@/lib/utils";

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
  stripePaymentId?: string | null;
  createdAt: string;
  table: Table;
  items: OrderItem[];
}

export function HistorialClient({ initialOrders }: { initialOrders: Order[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = initialOrders.filter(o =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.table.number.toString().includes(search)
  );

  const totalRecaudado = filtered.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de pedidos</h1>
        <p className="text-gray-500 text-sm mt-0.5">{filtered.length} pedidos entregados</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Total pedidos</p>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Total recaudado</p>
          <p className="text-2xl font-bold text-green-600">{formatCLP(totalRecaudado)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500">Ticket promedio</p>
          <p className="text-2xl font-bold text-gray-900">
            {filtered.length > 0 ? formatCLP(Math.round(totalRecaudado / filtered.length)) : formatCLP(0)}
          </p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o mesa..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>No hay pedidos entregados aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🍽</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{order.customerName}</p>
                    <p className="text-xs text-gray-500">
                      Mesa {order.table.number}{order.table.label ? ` · ${order.table.label}` : ""} ·{" "}
                      {new Date(order.createdAt).toLocaleString("es-CL", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-600 text-sm">{formatCLP(order.total)}</span>
                  <span className="text-gray-400 text-xs">{expanded === order.id ? "▲" : "▼"}</span>
                </div>
              </button>

              {expanded === order.id && (
                <div className="border-t px-4 py-3 bg-gray-50 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Productos</p>
                    <div className="space-y-1">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.quantity}x {item.product.name}</span>
                          <span className="text-gray-500">{formatCLP(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span><span>{formatCLP(order.subtotal)}</span>
                    </div>
                    {order.includeTip && (
                      <div className="flex justify-between text-xs text-amber-600">
                        <span>Propina</span><span>+{formatCLP(order.tipAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm">
                      <span>Total</span><span className="text-green-600">{formatCLP(order.total)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Medio de pago:</span>
                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {order.stripePaymentId ? "💳 Stripe" : "Efectivo / Otro"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}