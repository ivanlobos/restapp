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

  // Validar que la categoría pertenezca al tenant
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  const validAreas = ["KITCHEN", "BAR", "ALL"];
  const area = body.area !== undefined
    ? (validAreas.includes(body.area) ? body.area : existing.area)
    : undefined;

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(area !== undefined && { area }),
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

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

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
