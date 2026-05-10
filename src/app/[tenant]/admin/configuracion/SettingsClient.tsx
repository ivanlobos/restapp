"use client";

import { useState } from "react";
import { Settings, Check } from "lucide-react";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export function SettingsClient({ initialWeekStartDay }: { initialWeekStartDay: number }) {
  const [weekStartDay, setWeekStartDay] = useState(initialWeekStartDay);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStartDay }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else alert("Error al guardar");
    } catch { alert("Error de conexión"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-0.5">Ajustes generales del local</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Settings size={18} className="text-amber-600" />
          <h2 className="font-semibold text-gray-800">Analítica</h2>
        </div>
        <div className="p-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Primer día de la semana laboral
          </label>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS.map(({ value, label }) => (
              <button key={value} onClick={() => setWeekStartDay(value)} className={"rounded-xl py-2.5 text-xs font-medium transition-colors border " + (weekStartDay === value ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300")}>
                {label.slice(0, 3)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-5">
            La semana en la analítica comparativa comenzará cada <span className="font-medium text-gray-600">{DAYS[weekStartDay].label}</span>.
          </p>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            {saved ? <><Check size={14} /> Guardado</> : saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
