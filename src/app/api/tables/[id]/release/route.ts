import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getAdminSession } from "@/lib/admin-session";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { tenantSlug } = body;

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const session = await getAdminSession(tenantSlug);
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const existing = await prisma.table.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  await prisma.order.updateMany({
    where: { tableId: id, status: { not: "PAID" } },
    data: { status: "PAID" },
  });

  const table = await prisma.table.update({
    where: { id },
    data: {
      status: "FREE",
      releasedAt: new Date(),
    },
    include: {
      orders: {
        where: { status: { in: ["PAID", "CANCELLED"] } },
        select: { id: true, customerName: true, status: true, total: true, createdAt: true, updatedAt: true, items: true },
      },
      waiterCalls: true,
    },
  });

  return NextResponse.json(table);
}
