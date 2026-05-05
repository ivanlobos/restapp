import { prisma } from "@/lib/prisma";
import { MesasClient } from "./MesasClient";

export const dynamic = "force-dynamic";

export default async function MesasPage() {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: {
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