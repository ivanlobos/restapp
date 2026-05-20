import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");
  const categoryId = searchParams.get("categoryId");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: {
      tenantId: tenant.id,
      categoryId: categoryId ? categoryId : undefined,
    },
    orderBy: { sortOrder: "asc" },
    include: { category: true },
  });
  return NextResponse.json(products);
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

  // Validar que la categoría pertenezca al tenant
  if (body.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category || category.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
    }
  }

  const product = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: body.name,
      description: body.description || null,
      price: Number(body.price),
      categoryId: body.categoryId,
      imageUrl: body.imageUrl || null,
      sortOrder: body.sortOrder ?? 0,
    },
    include: { category: true },
  });
  return NextResponse.json(product, { status: 201 });
}
