"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, BarChart2, RefreshCw } from "lucide-react";

function formatCLP(value: number): string {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

function pct(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

function Delta({ current, prev }: { current: number; prev: number }) {
  const p = pct(current, prev);
  if (p === null) return <span className="text-xs text-gray-400">sin datos ant.</span>;
  if (p === 0) return <span className="flex items-center gap-0.5 text-xs text-gray-400"><Minus size={12} /> 0%</span>;
  if (p > 0) return <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600"><TrendingUp size={12} /> +{p}%</span>;
  return <span className="flex items-center gap-0.5 text-xs font-semibold text-red-500"><TrendingDown size={12} /> {p}%</span>;
}

interface PeriodData {
  totalSales: number;
  totalNet: number;
  totalIVA: number;
  totalTips: number;
  orderCount: number;
  avgTicket: number;
}

interface AnalyticsData {
  weekStartDay: number;
  thisWeek: PeriodData;
  lastWeekSame: PeriodData;
  thisMonth: PeriodData;
  lastMonthSame: PeriodData;
}

function PeriodCard({ title, current, prev, accent }: { title: string; current: PeriodData; prev: PeriodData; accent: string }) {
  const rows: { label: string; key: keyof PeriodData; fmt: (v: number) => string }[] = [
    { label: "Ventas brutas", key: "totalSales", fmt: formatCLP },
    { label: "Neto (sin IVA)", key: "totalNet", fmt: formatCLP },
    { label: "IVA (19%)", key: "totalIVA", fmt: formatCLP },
    { label: "Propinas", key: "totalTips", fmt: formatCLP },
    { label: "Pedidos", key: "orderCount", fmt: (v) => String(v) },
    { label: "Ticket promedio", key: "avgTicket", fmt: formatCLP },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={"px-5 py-3 border-b border-gray-100 " + accent}>
        <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map(({ label, key, fmt }) => (
          <div key={key} className="flex items-center justify-between px-5 py-2.5">
            <span className="text-xs text-gray-500">{label}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-800">{fmt(current[key])}</span>
              <Delta current={current[key]} prev={prev[key]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function AnalyticsSection() {
  const params = useParams();
  const tenantSlug = params.tenant as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (manual = false) => {
    if (!tenantSlug) return;
    if (manual) setRefreshing(true);
    try {
      const res = await fetch(`/api/analytics?tenantSlug=${encodeURIComponent(tenantSlug)}`);
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [tenantSlug]);

  useEffect(() => {
    fetchData();
    const i = setInterval(() => fetchData(), 60000);
    return () => clearInterval(i);
  }, [fetchData]);

  if (loading) return (
    <div className="mb-8 animate-pulse">
      <div className="h-6 bg-gray-100 rounded w-40 mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );

  if (!data) return null;

  const dayName = DAY_NAMES[data.weekStartDay];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-amber-600" />
          <h2 className="font-semibold text-gray-800">Analítica comparativa</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">semana desde el {dayName}</span>
        </div>
        <button onClick={() => fetchData(true)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PeriodCard
          title="Esta semana (acumulado)"
          current={data.thisWeek}
          prev={data.lastWeekSame}
          accent="bg-blue-50"
        />
        <PeriodCard
          title="Este mes (acumulado)"
          current={data.thisMonth}
          prev={data.lastMonthSame}
          accent="bg-purple-50"
        />
      </div>
    </div>
  );
}
