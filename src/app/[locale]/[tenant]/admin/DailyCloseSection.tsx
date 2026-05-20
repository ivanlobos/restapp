"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Lock, TrendingUp, Receipt, Calculator, Users, X, Printer } from "lucide-react";

function formatCLP(value: number): string {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

interface DailyData {
  totalSales: number;
  totalNet: number;
  totalIVA: number;
  totalTips: number;
  orderCount: number;
  avgTicket: number;
  isClosed: boolean;
  closedAt: string | null;
}

export function DailyCloseSection() {
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      const res = await fetch(`/api/daily-close?tenantSlug=${encodeURIComponent(tenantSlug)}`);
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [tenantSlug]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  const handleClose = async () => {
    if (!confirm("¿Cerrar la jornada de hoy? Esta acción no se puede deshacer.")) return;
    setClosing(true);
    try {
      const res = await fetch("/api/daily-close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      if (res.ok) { await fetchData(); setShowModal(true); }
      else { const err = await res.json(); alert(err.error || "Error al cerrar"); }
    } catch (err) { alert("Error de conexión"); }
    finally { setClosing(false); }
  };

  if (loading) return <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 animate-pulse"><div className="h-32 bg-gray-100 rounded-xl" /></div>;
  if (!data) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-amber-600" />
            <h2 className="font-semibold text-gray-800">Jornada del día</h2>
          </div>
          <div className="flex items-center gap-2">
            {data.isClosed && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                <Lock size={12} /> Cerrada {data.closedAt ? new Date(data.closedAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
            )}
            <button onClick={handleClose} disabled={closing || data.orderCount === 0} className={"flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed " + (data.isClosed ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600")}>
              <Lock size={14} /> {closing ? "Procesando..." : data.isClosed ? "Actualizar cierre" : "Cerrar jornada"}
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-600">Ventas brutas</span>
              </div>
              <p className="text-xl font-bold text-green-700">{formatCLP(data.totalSales)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calculator size={14} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Neto (sin IVA)</span>
              </div>
              <p className="text-xl font-bold text-blue-700">{formatCLP(data.totalNet)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={14} className="text-purple-600" />
                <span className="text-xs font-medium text-purple-600">IVA (19%)</span>
              </div>
              <p className="text-xl font-bold text-purple-700">{formatCLP(data.totalIVA)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-amber-600" />
                <span className="text-xs font-medium text-amber-600">Propinas</span>
              </div>
              <p className="text-xl font-bold text-amber-700">{formatCLP(data.totalTips)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Receipt size={14} className="text-gray-600" />
                <span className="text-xs font-medium text-gray-600">Pedidos</span>
              </div>
              <p className="text-xl font-bold text-gray-700">{data.orderCount}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-gray-600" />
                <span className="text-xs font-medium text-gray-600">Ticket promedio</span>
              </div>
              <p className="text-xl font-bold text-gray-700">{formatCLP(data.avgTicket)}</p>
            </div>
          </div>
        </div>
      </div>

      {showModal && data && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Jornada cerrada</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-green-600 font-medium">Total del día</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{formatCLP(data.totalSales)}</p>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Neto</span><span className="font-medium">{formatCLP(data.totalNet)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">IVA (19%)</span><span className="font-medium">{formatCLP(data.totalIVA)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Propinas</span><span className="font-medium">{formatCLP(data.totalTips)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Pedidos atendidos</span><span className="font-medium">{data.orderCount}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Ticket promedio</span><span className="font-medium">{formatCLP(data.avgTicket)}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"><Printer size={14} /> Imprimir</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">Listo</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
