"use client";

import { useEffect, useState } from "react";
import { BellRing, Check } from "lucide-react";

interface WaiterCall {
  id: string;
  tableId: string;
  createdAt: string;
  table: { number: number; label?: string | null };
}

export function WaiterCalls() {
  const [calls, setCalls] = useState<WaiterCall[]>([]);

  const fetchCalls = async () => {
    const res = await fetch("/api/waiter");
    if (res.ok) setCalls(await res.json());
  };

  const attend = async (id: string) => {
    await fetch("/api/waiter", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 5000);
    return () => clearInterval(interval);
  }, []);

  if (calls.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {calls.map((call) => (
        <div key={call.id}
          className="bg-red-500 text-white rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <BellRing size={20} />
            <div>
              <p className="font-bold text-sm">¡Mesa {call.table.number} llama!</p>
              <p className="text-xs text-red-100">
                {new Date(call.createdAt).toLocaleTimeString("es-CL")}
              </p>
            </div>
          </div>
          <button onClick={() => attend(call.id)}
            className="bg-white text-red-500 rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1 hover:bg-red-50 transition-colors">
            <Check size={14} /> Atendido
          </button>
        </div>
      ))}
    </div>
  );
}
