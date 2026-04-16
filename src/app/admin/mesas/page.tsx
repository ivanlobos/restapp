import { prisma } from "@/lib/prisma";
import { MesasClient } from "./MesasClient";

export const dynamic = "force-dynamic";

export default async function MesasPage() {
  const tables = await prisma.table.findMany({ orderBy: { number: "asc" } });
  return <MesasClient initialTables={tables} />;
}
