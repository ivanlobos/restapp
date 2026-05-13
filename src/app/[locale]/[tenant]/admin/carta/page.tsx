import { prisma } from "@/lib/prisma";
import { CartaClient } from "./CartaClient";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type CartaPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function CartaPage({ params }: CartaPageProps) {
  const { tenant: tenantSlug } = await params;
  const tenant = await requireTenant(tenantSlug);

  const categories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { tenantId: tenant.id },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return <CartaClient initialCategories={categories} />;
}
