"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { QrCode, Plus, Trash2, X, Download, FileText, Users, Coffee, Bell, Clock, Map, List, RefreshCw, Unlock } from "lucide-react";
import jsPDF from "jspdf";
import { useTableAutoRelease } from "@/lib/hooks/useTableAutoRelease";

interface OrderItem { quantity: number }
interface ActiveOrder { id: string; customerName: string; status: string; total: number; createdAt: Date | string; updatedAt: Date | string; items: OrderItem[] }
interface WaiterCall { id: string; createdAt: Date | string }
interface Table { id: string; number: number; label?: string | null; isActive: boolean; status: string; releasedAt?: Date | string | null; capacity?: number | null; orders?: ActiveOrder[]; waiterCalls?: WaiterCall[] }
type ViewMode = "map" | "list";

function getTableStatus(table: Table): "free" | "occupied" | "waiter" {
  if (table.waiterCalls && table.waiterCalls.length > 0) return "waiter";
  if (table.status === "OCCUPIED") return "occupied";
  return "free";
}

function getStatusConfig(status: "free" | "occupied" | "waiter") {
  switch (status) {
    case "free": return { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", text: "text-green-700", label: "Libre", icon: Coffee };
    case "occupied": return { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", label: "Ocupada", icon: Users };
    case "waiter": return { bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", text: "text-red-700", label: "Llamando garzón", icon: Bell };
  }
}

function timeAgo(dateStr: Date | string): string {
  const now = new Date();
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return diffMin + " min";
  return Math.floor(diffMin / 60) + "h " + (diffMin % 60) + "m";
}

function minutesUntilRelease(order: ActiveOrder, autoReleaseMinutes: number): number {
  const lastActivity = new Date(order.updatedAt).getTime();
  const elapsed = (Date.now() - lastActivity) / 60_000;
  return Math.max(0, Math.round(autoReleaseMinutes - elapsed));
}

const statusLabel: Record<string, string> = { PENDING: "Pendiente", PROCESSING: "En proceso", PAID: "Pagado", PREPARING: "Preparando" };

function formatCLP(value: number): string {
  return value.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

interface MesasClientProps {
  initialTables: Table[];
  tableAutoReleaseMinutes: number;
}

export function MesasClient({ initialTables, tableAutoReleaseMinutes }: MesasClientProps) {
  const params = useParams();
  const tenantSlug = params?.tenant as string;
  const locale = params?.locale as string;

  const { tables: polledTables } = useTableAutoRelease(tenantSlug, tableAutoReleaseMinutes);

  const [tables, setTables] = useState<Table[]>(initialTables);
  const [showForm, setShowForm] = useState(false);
  const [number, setNumber] = useState("");
  const [label, setLabel] = useState("");
  const [qrModal, setQrModal] = useState<Table | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [releasingIds, setReleasingIds] = useState<Set<string>>(new Set());
  const [releaseError, setReleaseError] = useState<string | null>(null);

  // Sync whenever the hook polls new data
  useEffect(() => {
    if (polledTables.length > 0) {
      setTables(polledTables as Table[]);
      setLastUpdate(new Date());
    }
  }, [polledTables]);

  const refreshData = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      setRefreshing(true);
      const res = await fetch(`/api/tables?tenantSlug=${tenantSlug}`);
      if (res.ok) { setTables(await res.json()); setLastUpdate(new Date()); }
    } catch (err) { console.error("Error refreshing:", err); }
    finally { setRefreshing(false); }
  }, [tenantSlug]);

  const freeTables = tables.filter((t) => t.isActive && getTableStatus(t) === "free").length;
  const occupiedTables = tables.filter((t) => t.isActive && getTableStatus(t) === "occupied").length;
  const waiterTables = tables.filter((t) => t.isActive && getTableStatus(t) === "waiter").length;
  const activeTables = tables.filter((t) => t.isActive).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/tables", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: parseInt(number), label: label || undefined, tenantSlug }) });
    if (res.ok) { const table = await res.json(); setTables((prev) => [...prev, table].sort((a, b) => a.number - b.number)); setNumber(""); setLabel(""); setShowForm(false); }
    setLoading(false);
  };

  const handleDownloadPDF = async (table: Table) => {
    const qrUrl = window.location.origin + "/api/qr/" + table.id + "?tenantSlug=" + tenantSlug;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = qrUrl;
    img.onload = () => {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210; const pageH = 297;
      pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, pageW, pageH, "F");
      pdf.setFillColor(245, 158, 11); pdf.rect(0, 0, pageW, 40, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(28);
      pdf.text("RestaurantApp", pageW / 2, 22, { align: "center" });
      pdf.setFontSize(13); pdf.setFont("helvetica", "normal");
      pdf.text("Escanea el QR para ver la carta y pedir", pageW / 2, 33, { align: "center" });
      pdf.setTextColor(30, 30, 30); pdf.setFont("helvetica", "bold"); pdf.setFontSize(52);
      pdf.text("Mesa " + table.number, pageW / 2, 80, { align: "center" });
      if (table.label) { pdf.setFont("helvetica", "normal"); pdf.setFontSize(18); pdf.setTextColor(100, 100, 100); pdf.text(table.label, pageW / 2, 93, { align: "center" }); }
      const qrSize = 120; const qrX = (pageW - qrSize) / 2;
      const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d")!; ctx.drawImage(img, 0, 0);
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", qrX, 105, qrSize, qrSize);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(150, 150, 150);
      pdf.text(window.location.origin + "/" + locale + "/" + tenantSlug + "/mesa/" + table.id, pageW / 2, 233, { align: "center" });
      pdf.setFillColor(245, 158, 11); pdf.rect(0, pageH - 20, pageW, 20, "F");
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(10); pdf.setFont("helvetica", "normal");
      pdf.text("Powered by RestaurantApp", pageW / 2, pageH - 8, { align: "center" });
      pdf.save("mesa-" + table.number + ".pdf");
    };
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta mesa?")) return;
    const res = await fetch("/api/tables/" + id + "?tenantSlug=" + tenantSlug, { method: "DELETE" });
    if (res.ok) setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggle = async (table: Table) => {
    const res = await fetch("/api/tables/" + table.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !table.isActive, tenantSlug }) });
    if (res.ok) { const updated = await res.json(); setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t))); }
  };

  const refreshTables = async () => {
    const res = await fetch(`/api/tables?tenantSlug=${encodeURIComponent(tenantSlug)}`);
    if (res.ok) {
      const updated = await res.json();
      setTables(updated);
    }
  };

  const handleRelease = async (tableId: string) => {
    setReleasingIds((prev) => new Set(prev).add(tableId));
    setReleaseError(null);
    try {
      const res = await fetch(`/api/tables/${tableId}/release`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setReleaseError("Sesión expirada, recargá la página");
        } else {
          const data = await res.json().catch(() => ({}));
          setReleaseError(`Error al liberar la mesa: ${data.error ?? res.statusText}`);
        }
        return;
      }
      const updated = await res.json();
      setTables((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      await refreshTables();
    } catch (err) {
      setReleaseError(`Error al liberar la mesa: ${err instanceof Error ? err.message : "Error desconocido"}`);
    } finally {
      setReleasingIds((prev) => { const next = new Set(prev); next.delete(tableId); return next; });
    }
  };

  return (
    <div className="p-6">
      {releaseError && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <span>{releaseError}</span>
          <button onClick={() => setReleaseError(null)} className="ml-4 text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-gray-500 text-sm">{activeTables} mesas activas · Actualizado {lastUpdate ? lastUpdate.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setViewMode("map")} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors " + (viewMode === "map" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}><Map size={15} /> Mapa</button>
            <button onClick={() => setViewMode("list")} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors " + (viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}><List size={15} /> Gestión</button>
          </div>
          <button onClick={refreshData} disabled={refreshing} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
          <button onClick={() => { setViewMode("list"); setShowForm(true); }} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"><Plus size={18} /> Nueva mesa</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><Coffee size={16} className="text-green-600" /></div>
          <div><p className="text-lg font-bold text-green-700">{freeTables}</p><p className="text-xs text-green-600">Libres</p></div>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Users size={16} className="text-amber-600" /></div>
          <div><p className="text-lg font-bold text-amber-700">{occupiedTables}</p><p className="text-xs text-amber-600">Ocupadas</p></div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><Bell size={16} className="text-red-600" /></div>
          <div><p className="text-lg font-bold text-red-700">{waiterTables}</p><p className="text-xs text-red-600">Llamando</p></div>
        </div>
      </div>

      {viewMode === "map" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.filter((t) => t.isActive).map((table) => {
            const status = getTableStatus(table);
            const config = getStatusConfig(status);
            const StatusIcon = config.icon;
            const activeOrder = table.orders?.[0];
            const totalItems = activeOrder?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
            const minsLeft = activeOrder ? minutesUntilRelease(activeOrder, tableAutoReleaseMinutes) : null;
            return (
              <div key={table.id} className={config.bg + " border-2 " + config.border + " rounded-2xl p-4 transition-all hover:shadow-md relative " + (status === "waiter" ? "animate-pulse" : "")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={"w-2.5 h-2.5 rounded-full " + config.dot} />
                    <span className={"text-xs font-medium " + config.text}>{config.label}</span>
                  </div>
                  <StatusIcon size={16} className={config.text} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{table.number}</h3>
                {table.label && <p className="text-xs text-gray-500 mb-2">{table.label}</p>}
                {status === "free" && table.releasedAt && (
                  <p className="text-[10px] text-gray-400 mt-1">Liberada {timeAgo(table.releasedAt)}</p>
                )}
                {activeOrder && status === "occupied" && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50">
                    <p className="text-xs font-medium text-gray-700 truncate">{activeOrder.customerName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{totalItems} ítem{totalItems !== 1 ? "s" : ""}</span>
                      <span className="text-xs font-semibold text-gray-700">{formatCLP(activeOrder.total)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock size={10} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">{timeAgo(activeOrder.createdAt)}</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-white/60 text-gray-600">{statusLabel[activeOrder.status] ?? activeOrder.status}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/40">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        {minsLeft === 0 ? "Liberando..." : `Libera en ${minsLeft} min`}
                      </span>
                      <button
                        onClick={() => handleRelease(table.id)}
                        disabled={releasingIds.has(table.id)}
                        className="text-[10px] text-red-600 hover:text-red-800 font-medium flex items-center gap-0.5 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Unlock size={9} /> {releasingIds.has(table.id) ? "..." : "Liberar"}
                      </button>
                    </div>
                  </div>
                )}
                {!activeOrder && status === "free" && !table.releasedAt && <p className="text-xs text-gray-400 mt-2">Sin pedidos</p>}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "list" && (
        <>
          {showForm && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
              <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Número *</label>
                  <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Ej: 5" min={1} required className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-24" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Etiqueta</label>
                  <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: Terraza" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-36" />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">Crear</button>
                  <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={18} /></button>
                </div>
              </form>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => {
              const tableStatus = getTableStatus(table);
              const activeOrder = table.orders?.[0];
              const minsLeft = activeOrder ? minutesUntilRelease(activeOrder, tableAutoReleaseMinutes) : null;
              return (
                <div key={table.id} className={"bg-white rounded-2xl p-5 shadow-sm border transition-colors " + (table.isActive ? "border-gray-100" : "border-gray-200 opacity-60")}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Mesa {table.number}</h3>
                      {table.label && <p className="text-gray-400 text-sm">{table.label}</p>}
                    </div>
                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (table.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>{table.isActive ? "Activa" : "Inactiva"}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (tableStatus === "occupied" || tableStatus === "waiter" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>
                      {tableStatus === "waiter" ? "Llamando garzón" : tableStatus === "occupied" ? "OCCUPIED" : "FREE"}
                    </span>
                    {table.releasedAt && tableStatus === "free" && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} /> Liberada {timeAgo(table.releasedAt)}
                      </span>
                    )}
                  </div>

                  {tableStatus === "occupied" && minsLeft !== null && (
                    <div className="flex items-center justify-between mb-3 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-xs text-red-700 font-medium">
                        {minsLeft === 0 ? "Liberando automáticamente..." : `Liberará en ${minsLeft} min`}
                      </span>
                      <button
                        onClick={() => handleRelease(table.id)}
                        disabled={releasingIds.has(table.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 bg-white border border-red-200 hover:border-red-400 px-2 py-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Unlock size={11} /> {releasingIds.has(table.id) ? "Liberando..." : "Liberar ahora"}
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => setQrModal(table)} className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-sm py-2 rounded-lg transition-colors"><QrCode size={16} /> Ver QR</button>
                    <button onClick={() => handleToggle(table)} className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors">{table.isActive ? "Desactivar" : "Activar"}</button>
                    <button onClick={() => handleDelete(table.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          {tables.length === 0 && (<div className="text-center py-16 text-gray-400"><p className="text-4xl mb-3">🪑</p><p>No hay mesas. Crea una para empezar.</p></div>)}
        </>
      )}

      {qrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Mesa {qrModal.number}</h3>
              <button onClick={() => setQrModal(null)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <img src={"/api/qr/" + qrModal.id + "?tenantSlug=" + tenantSlug} alt={"QR Mesa " + qrModal.number} className="w-64 h-64 border border-gray-200 rounded-xl" />
              <p className="text-xs text-gray-400 text-center break-all">{typeof window !== "undefined" ? window.location.origin : ""}/{locale}/{tenantSlug}/mesa/{qrModal.id}</p>
              <a href={"/api/qr/" + qrModal.id + "?tenantSlug=" + tenantSlug} download={"mesa-" + qrModal.number + ".png"} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors w-full justify-center"><Download size={16} /> Descargar PNG</a>
              <button onClick={() => handleDownloadPDF(qrModal)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors w-full justify-center"><FileText size={16} /> Descargar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
