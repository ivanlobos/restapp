import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

  const settings = await prisma.settings.findUnique({ where: { tenantId: tenant.id } });
  return NextResponse.json(settings ?? { tenantId: tenant.id, weekStartDay: 1 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { weekStartDay, tenantSlug } = body;

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

  if (typeof weekStartDay !== "number" || weekStartDay < 0 || weekStartDay > 6) {
    return NextResponse.json({ error: "Valor invalido" }, { status: 400 });
  }

  const settings = await prisma.settings.upsert({
    where: { tenantId: tenant.id },
    update: { weekStartDay },
    create: { tenantId: tenant.id, weekStartDay },
  });
  return NextResponse.json(settings);
}
