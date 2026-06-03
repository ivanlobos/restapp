import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getAdminSession } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  try {
    const { tableId, tenantSlug } = await req.json();
    if (!tenantSlug || typeof tenantSlug !== "string") {
      return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
    }
    if (!tableId || typeof tableId !== "string") {
      return NextResponse.json({ error: "tableId requerido" }, { status: 400 });
    }

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table || table.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Mesa no válida" }, { status: 404 });
    }

    // Anti-spam: máximo 1 llamado pendiente por mesa
    const existing = await prisma.waiterCall.findFirst({
      where: { tableId, tenantId: tenant.id, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json({ error: "Ya hay un llamado pendiente para esta mesa" }, { status: 429 });
    }

    const notification = await prisma.waiterCall.create({
      data: { tenantId: tenant.id, tableId, status: "PENDING" },
    });
    return NextResponse.json(notification);
  } catch (error) {
    console.error("Waiter call error:", error);
    return NextResponse.json({ error: "Error llamando al garzón" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
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

    const calls = await prisma.waiterCall.findMany({
      where: { tenantId: tenant.id, status: "PENDING" },
      include: { table: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(calls);
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, tenantSlug } = await req.json();
    if (!tenantSlug || typeof tenantSlug !== "string") {
      return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
    }
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id requerido" }, { status: 400 });
    }

    const session = await getAdminSession(tenantSlug);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const call = await prisma.waiterCall.findUnique({ where: { id } });
    if (!call || call.tenantId !== tenant.id) {
      return NextResponse.json({ error: "WaiterCall no encontrado" }, { status: 404 });
    }

    await prisma.waiterCall.update({
      where: { id },
      data: { status: "ATTENDED" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
