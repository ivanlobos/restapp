import { prisma } from "@/lib/prisma";
import { PedidosClient } from "./PedidosClient";
import { requireTenant } from "@/lib/tenant";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

type PedidosPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function PedidosPage({ params }: PedidosPageProps) {
  const { tenant: tenantSlug } = await params;
  const tenant = await requireTenant(tenantSlug);
  const session = await getAdminSession(tenantSlug);
  const role = session?.role ?? "OWNER";

  // Determinar qué áreas de categoría mostrar según el rol
  const areaFilter: string[] | null =
    role === "KITCHEN" ? ["KITCHEN", "ALL"] :
    role === "BAR"     ? ["BAR", "ALL"] :
    null; // OWNER ve todo

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["PENDING", "PROCESSING", "PAID", "PREPARING"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
    },
  });

  // Filtrar ítems por área si el rol lo requiere
  const filteredOrders = orders.map((order) => ({
    ...order,
    items: areaFilter
      ? order.items.filter((item) =>
          areaFilter.includes(item.product.category?.area ?? "ALL")
        )
      : order.items,
  })).filter((order) =>
    // Si todos los ítems del pedido fueron filtrados, no mostrar el pedido
    areaFilter ? order.items.length > 0 : true
  );

  return (
    <PedidosClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialOrders={filteredOrders as any}
      role={role}
    />
  );
}
