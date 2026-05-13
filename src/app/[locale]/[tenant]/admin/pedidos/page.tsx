import { prisma } from "@/lib/prisma";
import { PedidosClient } from "./PedidosClient";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type PedidosPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function PedidosPage({ params }: PedidosPageProps) {
  const { tenant: tenantSlug } = await params;
  const tenant = await requireTenant(tenantSlug);

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["PENDING", "PROCESSING", "PAID", "PREPARING"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { product: true } },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PedidosClient initialOrders={orders as any} />;
}
