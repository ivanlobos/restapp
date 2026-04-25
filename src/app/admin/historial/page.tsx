import { prisma } from "@/lib/prisma";
import { HistorialClient } from "./HistorialClient";

export default async function HistorialPage() {
  const pedidos = await prisma.order.findMany({
    where: { status: "DELIVERED" },
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { product: true } },
    },
  });

  return <HistorialClient initialOrders={pedidos} />;
}
