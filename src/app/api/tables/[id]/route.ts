import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getAdminSession } from "@/lib/admin-session";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const table = await prisma.table.findUnique({ where: { id } });
  if (!table || table.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }
  return NextResponse.json(table);
}

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

  const table = await prisma.table.update({
    where: { id },
    data: {
      label: body.label,
      isActive: body.isActive,
    },
  });
  return NextResponse.json(table);
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

  const existing = await prisma.table.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  await prisma.table.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
