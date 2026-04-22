import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MenuClient } from "./MenuClient";

export default async function MenuPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;

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

  return <MenuClient categories={categories} tableId={tableId} table={table} />;
}
