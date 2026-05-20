"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { LayoutDashboard, Table2, UtensilsCrossed, ClipboardList, History, Settings, LogOut } from "lucide-react";
import { useState } from "react";

const links = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "/mesas", label: "Mesas", icon: Table2 },
  { path: "/carta", label: "Carta", icon: UtensilsCrossed },
  { path: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { path: "/historial", label: "Historial", icon: History },
  { path: "/configuracion", label: "Configuracion", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const tenantSlug = params.tenant as string;
  const [loggingOut, setLoggingOut] = useState(false);

  // Prefijo base de todas las rutas admin de este tenant
  const adminBase = `/${locale}/${tenantSlug}/admin`;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      router.push(`/${locale}/${tenantSlug}/admin-login`);
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-gray-900 text-white fixed left-0 top-0">
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-bold text-lg">RestaurantApp</span>
          </div>
          <p className="text-gray-400 text-xs mt-0.5">Panel de administracion</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {links.map(({ path, label, icon: Icon }) => {
            const href = `${adminBase}${path}`;
            const active = path === "" ? pathname === adminBase : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={"flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors " + (active ? "bg-amber-500 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white")}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={18} />
            {loggingOut ? "Cerrando..." : "Cerrar sesion"}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white border-t border-gray-700 flex">
        {links.map(({ path, label, icon: Icon }) => {
          const href = `${adminBase}${path}`;
          const active = path === "" ? pathname === adminBase : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={"flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors " + (active ? "text-amber-400" : "text-gray-400")}>
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium text-gray-400 transition-colors disabled:opacity-50"
        >
          <LogOut size={20} />
          Salir
        </button>
      </nav>
    </>
  );
}
