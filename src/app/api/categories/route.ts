import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";

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
  return NextResponse.json(categories);
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

  const category = await prisma.category.create({
    data: {
      tenantId: tenant.id,
      name: body.name,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
