"use client";

import { useEffect, useRef, useState } from "react";

interface OrderSummary {
  id: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: { quantity: number }[];
}

interface WaiterCallSummary {
  id: string;
  createdAt: string;
}

export interface TableWithOrders {
  id: string;
  tenantId: string;
  number: number;
  label: string | null;
  isActive: boolean;
  status: string;
  releasedAt: string | null;
  capacity: number | null;
  createdAt: string;
  orders: OrderSummary[];
  waiterCalls: WaiterCallSummary[];
}

const POLL_INTERVAL_MS = 30_000;

export function useTableAutoRelease(
  tenantSlug: string,
  tableAutoReleaseMinutes: number
) {
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!tenantSlug) return;

    const checkAndRelease = async () => {
      if (firstLoad.current) setIsLoading(true);

      try {
        const res = await fetch(
          `/api/tables?tenantSlug=${encodeURIComponent(tenantSlug)}`
        );
        if (!res.ok) throw new Error("Error al obtener mesas");
        const data: TableWithOrders[] = await res.json();

        const now = Date.now();
        const thresholdMs = tableAutoReleaseMinutes * 60 * 1000;

        const toRelease = data.filter((t) => {
          if (t.status !== "OCCUPIED") return false;
          const latestOrder = t.orders[0];
          if (!latestOrder) return false;
          return now - new Date(latestOrder.updatedAt).getTime() > thresholdMs;
        });

        if (toRelease.length > 0) {
          await Promise.all(
            toRelease.map((t) =>
              fetch(`/api/tables/${t.id}/release`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenantSlug }),
              })
            )
          );

          const refreshed = await fetch(
            `/api/tables?tenantSlug=${encodeURIComponent(tenantSlug)}`
          );
          if (refreshed.ok) setTables(await refreshed.json());
        } else {
          setTables(data);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        if (firstLoad.current) {
          setIsLoading(false);
          firstLoad.current = false;
        }
      }
    };

    checkAndRelease();
    const interval = setInterval(checkAndRelease, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tenantSlug, tableAutoReleaseMinutes]);

  return { tables, isLoading, error };
}
