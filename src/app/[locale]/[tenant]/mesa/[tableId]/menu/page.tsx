import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuClient from "./MenuClient";
import { translateCategories } from "@/lib/translate";
import { requireTenant } from "@/lib/tenant";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ tableId: string; locale: string; tenant: string }>;
}) {
  const { tableId, locale, tenant: tenantSlug } = await params;
  const tenant = await requireTenant(tenantSlug);

  // Validar que la mesa exista, esté activa Y pertenezca al tenant
  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isActive || table.tenantId !== tenant.id) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { tenantId: tenant.id, isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const translatedCategories = await translateCategories(categories, locale);

  return (
    <MenuClient
      categories={translatedCategories}
      tableId={tableId}
      table={table}
      tenantSlug={tenantSlug}
    />
  );
}
