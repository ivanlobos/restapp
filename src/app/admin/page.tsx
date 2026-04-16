import { prisma } from "@/lib/prisma";
import { formatCLP } from "@/lib/utils";
import { ShoppingBag, CheckCircle, Clock, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, paidOrders, pendingOrders, todayRevenue, recentOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PREPARING", "DELIVERED"] }, createdAt: { gte: today } } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] }, createdAt: { gte: today } } }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "PREPARING", "DELIVERED"] }, createdAt: { gte: today } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { table: true },
    }),
  ]);

  const stats = [
    { label: "Pedidos hoy", value: totalOrders, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
    { label: "Pagados", value: paidOrders, icon: CheckCircle, color: "text-green-600 bg-green-50" },
    { label: "Pendientes", value: pendingOrders, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Ingresos hoy", value: formatCLP(todayRevenue._sum.total ?? 0), icon: DollarSign, color: "text-purple-600 bg-purple-50" },
  ];

  const statusLabel: Record<string, string> = {
    PENDING: "Pendiente",
    PROCESSING: "En proceso",
    PAID: "Pagado",
    PREPARING: "Preparando",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    PREPARING: "bg-orange-100 text-orange-700",
    DELIVERED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-gray-500 text-sm">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Pedidos recientes</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium text-sm text-gray-900">{order.customerName}</p>
                <p className="text-xs text-gray-400">Mesa {order.table.number} · {new Date(order.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-amber-600">{formatCLP(order.total)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No hay pedidos hoy</p>
          )}
        </div>
      </div>
    </div>
  );
}
