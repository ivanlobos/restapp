import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const tables = await prisma.table.findMany({
    where: { tenantId: tenant.id },
    orderBy: { number: "asc" },
    include: {
      orders: {
        where: {
          tenantId: tenant.id,
          status: { in: ["PENDING", "PROCESSING", "PREPARING", "PAID"] },
        },
        select: {
          id: true,
          customerName: true,
          status: true,
          total: true,
          createdAt: true,
          items: { select: { quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      waiterCalls: {
        where: { tenantId: tenant.id, status: "PENDING" },
        select: { id: true, createdAt: true },
        take: 1,
      },
    },
  });

  return NextResponse.json(tables);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tenantSlug } = body;

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const table = await prisma.table.create({
    data: {
      tenantId: tenant.id,
      number: Number(body.number),
      label: body.label || null,
    },
  });
  return NextResponse.json(table, { status: 201 });
}
