"use client";

import { useState } from "react";
import { BellRing, Check } from "lucide-react";

interface WaiterButtonProps {
  tableId: string;
  tenantSlug: string;
  compact?: boolean;
}

export function WaiterButton({ tableId, tenantSlug, compact = false }: WaiterButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  const handleCall = async () => {
    if (status !== "idle") return;
    setStatus("loading");
    try {
      await fetch("/api/waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, tenantSlug }),
      });
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 10000);
    } catch {
      setStatus("idle");
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleCall}
        disabled={status === "loading" || status === "sent"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
          status === "sent"
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600"
        }`}
      >
        {status === "sent" ? (
          <><Check size={13} /> ¡En camino!</>
        ) : (
          <><BellRing size={13} className={status === "loading" ? "animate-bounce" : ""} /> Llamar garzón</>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCall}
      disabled={status === "loading" || status === "sent"}
      className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-semibold text-sm transition-all ${
        status === "sent"
          ? "bg-green-500 text-white"
          : "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50"
      }`}
    >
      {status === "sent" ? (
        <><Check size={18} /> ¡Garzón en camino!</>
      ) : (
        <><BellRing size={18} className={status === "loading" ? "animate-bounce" : ""} /> Llamar al garzón</>
      )}
    </button>
  );
}