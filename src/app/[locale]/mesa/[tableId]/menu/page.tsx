import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MenuClient } from "./MenuClient";
import { translateCategories } from "@/lib/translate";

export default async function MenuPage({ params }: { params: Promise<{ tableId: string; locale: string }> }) {
  const { tableId, locale } = await params;

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isActive) notFound();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const translatedCategories = await translateCategories(categories, locale);

  return <MenuClient categories={translatedCategories} tableId={tableId} table={table} />;
}
