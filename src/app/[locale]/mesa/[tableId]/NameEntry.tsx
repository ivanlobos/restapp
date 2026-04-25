"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { User, Mail } from "lucide-react";

interface NameEntryProps {
  tableId: string;
  tableNumber: number;
}

export function NameEntry({ tableId, tableNumber }: NameEntryProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wantsEmail, setWantsEmail] = useState(false);
  const router = useRouter();
  const setSession = useCartStore((s) => s.setSession);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSession(tableId, trimmed, wantsEmail && email.trim() ? email.trim() : undefined);
    router.push(`/mesa/${tableId}/menu`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ¿Cómo te llamas?
        </label>
        <div className="relative">
          <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            autoFocus
            maxLength={50}
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Tu nombre aparecerá en tu pedido individual (Mesa {tableNumber})
        </p>
      </div>

      {/* Email opt-in */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={wantsEmail}
            onChange={(e) => setWantsEmail(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">
              ¿Te gustaría recibir novedades de nuestra carta?
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Opcional · Solo te escribiremos cuando haya algo especial 🎉
            </p>
          </div>
        </label>

        {wantsEmail && (
          <div className="relative mt-3">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-lg"
      >
        Ver la carta →
      </button>
    </form>
  );
}