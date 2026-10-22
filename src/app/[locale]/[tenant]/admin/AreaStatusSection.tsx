"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChefHat, Wine, Copy, Check } from "lucide-react";

interface AreaCount {
  pending: number;    // PENDING + PROCESSING + PAID
  preparing: number;  // PREPARING
}

interface LiveStatus {
  kitchen: AreaCount;
  bar: AreaCount;
}

function AreaCard({
  label,
  icon: Icon,
  color,
  counts,
  kioskPath,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  counts: AreaCount;
  kioskPath: string;
}) {
  const [copied, setCopied] = useState(false);
  const total = counts.pending + counts.preparing;

  const copyLink = () => {
    const url = `${window.location.origin}${kioskPath}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={18} />
          </div>
          <span className="font-semibold text-gray-800">{label}</span>
        </div>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors border border-gray-200 rounded-lg px-2.5 py-1.5"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          {copied ? "Copiado" : "Copiar link pantalla"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{counts.pending}</p>
          <p className="text-xs text-amber-600 mt-0.5">Por preparar</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-700">{counts.preparing}</p>
          <p className="text-xs text-orange-600 mt-0.5">Preparando</p>
        </div>
      </div>

      {total === 0 && (
        <p className="text-center text-xs text-gray-400 mt-3">✅ Sin pedidos activos</p>
      )}
    </div>
  );
}

export function AreaStatusSection() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const locale = params.locale as string;

  const [status, setStatus] = useState<LiveStatus | null>(null);

  const fetch_ = useCallback(async () => {
    const res = await fetch(`/api/orders/area-status?tenantSlug=${tenantSlug}`);
    if (res.ok) setStatus(await res.json());
  }, [tenantSlug]);

  useEffect(() => {
    fetch_();
    const i = setInterval(fetch_, 5000);
    return () => clearInterval(i);
  }, [fetch_]);

  if (!status) return null;

  return (
    <div className="mb-8">
      <h2 className="font-semibold text-gray-800 mb-3">Estado en vivo por área</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AreaCard
          label="Cocina"
          icon={ChefHat}
          color="text-orange-600 bg-orange-50"
          counts={status.kitchen}
          kioskPath={`/${locale}/${tenantSlug}/kiosk/cocina`}
        />
        <AreaCard
          label="Bar"
          icon={Wine}
          color="text-blue-600 bg-blue-50"
          counts={status.bar}
          kioskPath={`/${locale}/${tenantSlug}/kiosk/bar`}
        />
      </div>
    </div>
  );
}
