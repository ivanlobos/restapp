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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayClose = await prisma.dailyClose.findUnique({
    where: { tenantId_date: { tenantId: tenant.id, date: today } },
  });

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["PAID", "PREPARING", "DELIVERED"] },
      createdAt: { gte: today },
    },
    select: { total: true, tipAmount: true, subtotal: true },
  });

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTips = orders.reduce((sum, o) => sum + o.tipAmount, 0);
  const totalNet = Math.round(totalSales / 1.19);
  const totalIVA = totalSales - totalNet;
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  return NextResponse.json({
    totalSales,
    totalNet,
    totalIVA,
    totalTips,
    orderCount,
    avgTicket,
    isClosed: !!todayClose,
    closedAt: todayClose?.closedAt ?? null,
  });
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      status: { in: ["PAID", "PREPARING", "DELIVERED"] },
      createdAt: { gte: today },
    },
    select: { total: true, tipAmount: true },
  });

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTips = orders.reduce((sum, o) => sum + o.tipAmount, 0);
  const totalNet = Math.round(totalSales / 1.19);
  const totalIVA = totalSales - totalNet;
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  const dailyClose = await prisma.dailyClose.upsert({
    where: { tenantId_date: { tenantId: tenant.id, date: today } },
    create: { tenantId: tenant.id, date: today, totalSales, totalNet, totalIVA, totalTips, orderCount, avgTicket },
    update: { totalSales, totalNet, totalIVA, totalTips, orderCount, avgTicket, closedAt: new Date() },
  });

  return NextResponse.json(dailyClose);
}
