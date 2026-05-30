"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Settings, Check, CreditCard, Link2, Link2Off, Store } from "lucide-react";

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

type MpStatus = {
  enabled: boolean;
  hasAccessToken: boolean;
  hasPublicKey: boolean;
  hasWebhookSecret: boolean;
};

type TenantInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  legalName: string;
  taxId: string;
  currency: string;
};

const CURRENCIES = ["CLP", "USD", "EUR", "ARS", "PEN", "MXN"] as const;

type Props = {
  initialWeekStartDay: number;
  mpStatus: MpStatus;
  tenantInfo: TenantInfo;
};

export function SettingsClient({ initialWeekStartDay, mpStatus, tenantInfo }: Props) {
  const params = useParams();
  const tenantSlug = params?.tenant as string;

  // --- Analítica (weekStartDay) ---
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
        body: JSON.stringify({ weekStartDay, tenantSlug }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else alert("Error al guardar");
    } catch { alert("Error de conexión"); }
    finally { setSaving(false); }
  };

  // --- MP ---
  const [mp, setMp] = useState<MpStatus>(mpStatus);
  const [mpAccessTokenInput, setMpAccessTokenInput] = useState("");
  const [mpPublicKeyInput, setMpPublicKeyInput] = useState("");
  const [mpWebhookSecretInput, setMpWebhookSecretInput] = useState("");
  const [mpSaving, setMpSaving] = useState(false);
  const [mpSaved, setMpSaved] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);
  const [mpDisconnecting, setMpDisconnecting] = useState(false);

  const handleMpSave = async () => {
    setMpSaving(true);
    setMpSaved(false);
    setMpError(null);

    const body: Record<string, unknown> = { tenantSlug };
    if (mpAccessTokenInput.trim()) body.accessToken = mpAccessTokenInput.trim();
    if (mpPublicKeyInput.trim()) body.publicKey = mpPublicKeyInput.trim();
    if (mpWebhookSecretInput.trim()) body.webhookSecret = mpWebhookSecretInput.trim();
    body.enabled = mp.enabled;

    try {
      const res = await fetch("/api/settings/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMpError(data.error ?? "Error al guardar");
      } else {
        setMpSaved(true);
        setMpAccessTokenInput("");
        setMpPublicKeyInput("");
        setMpWebhookSecretInput("");
        // refrescar estado local
        setMp(prev => ({
          ...prev,
          hasAccessToken: prev.hasAccessToken || !!body.accessToken,
          hasPublicKey: prev.hasPublicKey || !!body.publicKey,
          hasWebhookSecret: prev.hasWebhookSecret || !!body.webhookSecret,
        }));
        setTimeout(() => setMpSaved(false), 3000);
      }
    } catch {
      setMpError("Error de conexión");
    } finally {
      setMpSaving(false);
    }
  };

  const handleMpDisconnect = async () => {
    if (!confirm("¿Desconectar Mercado Pago? Se eliminarán las credenciales guardadas.")) return;
    setMpDisconnecting(true);
    setMpError(null);
    try {
      const res = await fetch(`/api/settings/mercadopago?tenantSlug=${tenantSlug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMp({ enabled: false, hasAccessToken: false, hasPublicKey: false, hasWebhookSecret: false });
        setMpAccessTokenInput("");
        setMpPublicKeyInput("");
        setMpWebhookSecretInput("");
      } else {
        const data = await res.json();
        setMpError(data.error ?? "Error al desconectar");
      }
    } catch {
      setMpError("Error de conexión");
    } finally {
      setMpDisconnecting(false);
    }
  };

  // --- Datos del restaurante ---
  const [tenant, setTenant] = useState<TenantInfo>(tenantInfo);
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantSaved, setTenantSaved] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);

  const handleTenantChange = (field: keyof TenantInfo, value: string) => {
    setTenant(prev => ({ ...prev, [field]: value }));
  };

  const handleTenantSave = async () => {
    setTenantSaving(true);
    setTenantSaved(false);
    setTenantError(null);
    try {
      const res = await fetch("/api/settings/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          name: tenant.name,
          address: tenant.address,
          phone: tenant.phone,
          email: tenant.email,
          logoUrl: tenant.logoUrl,
          legalName: tenant.legalName,
          taxId: tenant.taxId,
          currency: tenant.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTenantError(data.error ?? "Error al guardar");
      } else {
        setTenantSaved(true);
        // Refrescar estado con valores normalizados del backend (vacios -> null -> "")
        setTenant({
          name: data.name ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          logoUrl: data.logoUrl ?? "",
          legalName: data.legalName ?? "",
          taxId: data.taxId ?? "",
          currency: data.currency ?? "CLP",
        });
        setTimeout(() => setTenantSaved(false), 3000);
      }
    } catch {
      setTenantError("Error de conexión");
    } finally {
      setTenantSaving(false);
    }
  };

  const mpIsConfigured = mp.hasAccessToken;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-0.5">Ajustes generales del local</p>
      </div>

      {/* CARD: Datos del restaurante */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="p-5 border-b border-gray-100 flex items-center gap-2">
          <Store size={18} className="text-amber-600" />
          <h2 className="font-semibold text-gray-800">Datos del restaurante</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Información que aparece en boletas, headers y otros lugares del sistema.
          </p>

          {/* Nombre comercial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre comercial <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tenant.name}
              onChange={(e) => handleTenantChange("name", e.target.value)}
              placeholder="Bar Imperial"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          {/* Razón social */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Razón social
            </label>
            <input
              type="text"
              value={tenant.legalName}
              onChange={(e) => handleTenantChange("legalName", e.target.value)}
              placeholder="Comercial Imperial SpA"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          {/* RUT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              RUT
            </label>
            <input
              type="text"
              value={tenant.taxId}
              onChange={(e) => handleTenantChange("taxId", e.target.value)}
              placeholder="76.123.456-7"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dirección
            </label>
            <input
              type="text"
              value={tenant.address}
              onChange={(e) => handleTenantChange("address", e.target.value)}
              placeholder="Av. Pajaritos 1234, Maipú"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
            />
          </div>

          {/* Teléfono y Email lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                value={tenant.phone}
                onChange={(e) => handleTenantChange("phone", e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={tenant.email}
                onChange={(e) => handleTenantChange("email", e.target.value)}
                placeholder="contacto@imperial.cl"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Logo (URL)
            </label>
            <input
              type="url"
              value={tenant.logoUrl}
              onChange={(e) => handleTenantChange("logoUrl", e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
            />
            {tenant.logoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={tenant.logoUrl}
                alt="Logo preview"
                className="mt-2 h-12 w-auto rounded border border-gray-200 object-contain bg-gray-50 p-1"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Moneda
            </label>
            <select
              value={tenant.currency}
              onChange={(e) => handleTenantChange("currency", e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors bg-white"
            >
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {tenantError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{tenantError}</p>
            </div>
          )}

          <div className="pt-1">
            <button
              onClick={handleTenantSave}
              disabled={tenantSaving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {tenantSaved ? <><Check size={14} /> Guardado</> : tenantSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>

      {/* CARD: Analítica */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
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

      {/* CARD: Mercado Pago */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-amber-600" />
            <h2 className="font-semibold text-gray-800">Mercado Pago</h2>
          </div>
          {mpIsConfigured ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <Link2 size={12} /> Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
              <Link2Off size={12} /> No configurado
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Pega tus credenciales de producción de Mercado Pago. El Access Token se guarda encriptado.
          </p>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Access Token
            </label>
            <input
              type="password"
              value={mpAccessTokenInput}
              onChange={(e) => setMpAccessTokenInput(e.target.value)}
              placeholder={mp.hasAccessToken ? "(ya configurado · pega uno nuevo para reemplazar)" : "APP_USR-..."}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
              autoComplete="off"
            />
          </div>

          {/* Public Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Public Key
            </label>
            <input
              type="text"
              value={mpPublicKeyInput}
              onChange={(e) => setMpPublicKeyInput(e.target.value)}
              placeholder={mp.hasPublicKey ? "(ya configurado · pega uno nuevo para reemplazar)" : "APP_USR-..."}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
              autoComplete="off"
            />
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Webhook Secret
            </label>
            <input
              type="password"
              value={mpWebhookSecretInput}
              onChange={(e) => setMpWebhookSecretInput(e.target.value)}
              placeholder={mp.hasWebhookSecret ? "(ya configurado · pega uno nuevo para reemplazar)" : "Clave de firma del webhook MP"}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Se obtiene en Mercado Pago → Tu integración → Webhooks. Se guarda encriptado.
            </p>
          </div>

          {/* Toggle activar */}
          <label className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">Pagos activados</p>
              <p className="text-xs text-gray-500">Solo se puede activar si hay un Access Token guardado.</p>
            </div>
            <button
              type="button"
              onClick={() => setMp(prev => ({ ...prev, enabled: !prev.enabled }))}
              disabled={!mp.hasAccessToken && !mpAccessTokenInput.trim()}
              className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed " + (mp.enabled ? "bg-amber-500" : "bg-gray-300")}
            >
              <span className={"inline-block h-4 w-4 transform rounded-full bg-white transition-transform " + (mp.enabled ? "translate-x-6" : "translate-x-1")} />
            </button>
          </label>

          {mpError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{mpError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleMpSave}
              disabled={mpSaving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {mpSaved ? <><Check size={14} /> Guardado</> : mpSaving ? "Guardando..." : "Guardar credenciales"}
            </button>

            {mpIsConfigured && (
              <button
                onClick={handleMpDisconnect}
                disabled={mpDisconnecting}
                className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-2.5 disabled:opacity-50"
              >
                {mpDisconnecting ? "Desconectando..." : "Desconectar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
