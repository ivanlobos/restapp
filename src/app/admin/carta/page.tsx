import { prisma } from "@/lib/prisma";
import { CartaClient } from "./CartaClient";

export const dynamic = "force-dynamic";

export default async function CartaPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: { orderBy: { sortOrder: "asc" } },
    },
  });
  return <CartaClient initialCategories={categories} />;
}
