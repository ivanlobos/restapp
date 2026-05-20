import { prisma } from "@/lib/prisma";
import { MesasClient } from "./MesasClient";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type MesasPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function MesasPage({ params }: MesasPageProps) {
  const { tenant: tenantSlug } = await params;
  const tenant = await requireTenant(tenantSlug);

  const tables = await prisma.table.findMany({
    where: { tenantId: tenant.id },
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: {
          tenantId: tenant.id,
          status: {
            in: ["PENDING", "PROCESSING", "PREPARING", "PAID"],
          },
        },
        select: {
          id: true,
          customerName: true,
          status: true,
          total: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      waiterCalls: {
        where: {
          tenantId: tenant.id,
          status: "PENDING",
        },
        select: {
          id: true,
          createdAt: true,
        },
        take: 1,
      },
    },
  });

  return <MesasClient initialTables={tables} />;
}
