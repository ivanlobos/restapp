import { prisma } from "@/lib/prisma";
import { PedidosClient } from "./PedidosClient";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "PROCESSING", "PAID", "PREPARING"] } },
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { product: true } },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PedidosClient initialOrders={orders as any} />;
}
