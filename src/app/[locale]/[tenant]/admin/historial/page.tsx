import { prisma } from "@/lib/prisma";
import { HistorialClient } from "./HistorialClient";
import { unstable_noStore as noStore } from "next/cache";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type HistorialPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function HistorialPage({ params }: HistorialPageProps) {
  noStore();
  const { tenant: tenantSlug } = await params;
  const tenant = await requireTenant(tenantSlug);

  const pedidos = await prisma.order.findMany({
    where: { tenantId: tenant.id, status: "DELIVERED" },
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
