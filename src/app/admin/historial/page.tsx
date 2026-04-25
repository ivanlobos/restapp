import { prisma } from "@/lib/prisma";
import { HistorialClient } from "./HistorialClient";
import { unstable_noStore as noStore } from "next/cache";

export default async function HistorialPage() {
  noStore();
  
  const pedidos = await prisma.order.findMany({
    where: { status: "DELIVERED" },
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { product: true } },
    },
  });

  const serialized = pedidos.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return <HistorialClient initialOrders={serialized} />;
}
