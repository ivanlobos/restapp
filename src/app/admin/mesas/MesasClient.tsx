"use client";

import { useState } from "react";
import { QrCode, Plus, Trash2, X, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import Image from "next/image";

interface Table {
  id: string;
  number: number;
  label?: string | null;
  isActive: boolean;
}

export function MesasClient({ initialTables }: { initialTables: Table[] }) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [showForm, setShowForm] = useState(false);
  const [number, setNumber] = useState("");
  const [label, setLabel] = useState("");
  const [qrModal, setQrModal] = useState<Table | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: parseInt(number), label: label || undefined }),
    });
    if (res.ok) {
      const table = await res.json();
      setTables((prev) => [...prev, table].sort((a, b) => a.number - b.number));
      setNumber("");
      setLabel("");
      setShowForm(false);
    }
    setLoading(false);
  };

const handleDownloadPDF = async (table: Table) => {
  const qrUrl = `${window.location.origin}/api/qr/${table.id}`;
  const img = new window.Image();
  img.crossOrigin = "anonymous";
  img.src = qrUrl;
  img.onload = () => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const pageH = 297;

    // Fondo blanco
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageW, pageH, "F");

    // Franja superior naranja
    pdf.setFillColor(245, 158, 11);
    pdf.rect(0, 0, pageW, 40, "F");

    // Nombre restaurante
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.text("RestaurantApp", pageW / 2, 22, { align: "center" });
    pdf.setFontSize(13);
    pdf.setFont("helvetica", "normal");
    pdf.text("Escanea el QR para ver la carta y pedir", pageW / 2, 33, { align: "center" });

    // Número de mesa grande
    pdf.setTextColor(30, 30, 30);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(52);
    pdf.text(`Mesa ${table.number}`, pageW / 2, 80, { align: "center" });

    // Etiqueta
    if (table.label) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(18);
      pdf.setTextColor(100, 100, 100);
      pdf.text(table.label, pageW / 2, 93, { align: "center" });
    }

    // QR centrado grande
    const qrSize = 120;
    const qrX = (pageW - qrSize) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const qrData = canvas.toDataURL("image/png");
    pdf.addImage(qrData, "PNG", qrX, 105, qrSize, qrSize);

    // URL debajo del QR
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    const url = `${window.location.origin}/mesa/${table.id}`;
    pdf.text(url, pageW / 2, 233, { align: "center" });

    // Franja inferior
    pdf.setFillColor(245, 158, 11);
    pdf.rect(0, pageH - 20, pageW, 20, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Powered by RestaurantApp", pageW / 2, pageH - 8, { align: "center" });

    pdf.save(`mesa-${table.number}.pdf`);
  };
};

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta mesa?")) return;
    const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
    if (res.ok) setTables((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggle = async (table: Table) => {
    const res = await fetch(`/api/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !table.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mesas</h1>
          <p className="text-gray-500 text-sm">{tables.length} mesas registradas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={18} />
          Nueva mesa
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Número *</label>
              <input
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Ej: 5"
                min={1}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-24"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Etiqueta</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: Terraza"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-36"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tables grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`bg-white rounded-2xl p-5 shadow-sm border transition-colors ${
              table.isActive ? "border-gray-100" : "border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Mesa {table.number}</h3>
                {table.label && <p className="text-gray-400 text-sm">{table.label}</p>}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  table.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {table.isActive ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setQrModal(table)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-sm py-2 rounded-lg transition-colors"
              >
                <QrCode size={16} />
                Ver QR
              </button>
              <button
                onClick={() => handleToggle(table)}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              >
                {table.isActive ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={() => handleDelete(table.id)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🪑</p>
          <p>No hay mesas. Crea una para empezar.</p>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Mesa {qrModal.number}</h3>
              <button onClick={() => setQrModal(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/${qrModal.id}`}
                alt={`QR Mesa ${qrModal.number}`}
                className="w-64 h-64 border border-gray-200 rounded-xl"
              />
              <p className="text-xs text-gray-400 text-center break-all">
                {process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/mesa/{qrModal.id}
              </p>
              <a
                href={`/api/qr/${qrModal.id}`}
                download={`mesa-${qrModal.number}.png`}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors w-full justify-center"
              >
                <Download size={16} />
                Descargar PNG
              </a>
                    <button
          onClick={() => handleDownloadPDF(qrModal)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors w-full justify-center"
        >
          <FileText size={16} />
          Descargar PDF
        </button>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
