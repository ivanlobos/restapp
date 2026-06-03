import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function getWeekStart(d: Date, weekStartDay: number) {
  const x = startOfDay(d);
  const current = x.getDay();
  const diff = (current - weekStartDay + 7) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

async function fetchPeriod(tenantId: string, from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      status: { in: ["PAID", "PREPARING", "DELIVERED"] },
      createdAt: { gte: from, lt: to },
    },
    select: { tipAmount: true, total: true },
  });

  const totalSales = orders.reduce((s, o) => s + o.total, 0);
  const totalTips = orders.reduce((s, o) => s + o.tipAmount, 0);
  const salesNoTip = totalSales - totalTips;
  const totalNet = Math.round(salesNoTip / 1.19);
  const totalIVA = salesNoTip - totalNet;
  const orderCount = orders.length;
  const avgTicket = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  return { totalSales, totalNet, totalIVA, totalTips, orderCount, avgTicket };
}

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
  const weekStartDay = settings?.weekStartDay ?? 1;

  const now = new Date();
  const tomorrow = startOfDay(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisWeekStart = getWeekStart(now, weekStartDay);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const daysElapsed = Math.floor((now.getTime() - thisWeekStart.getTime()) / 86400000) + 1;
  const lastWeekSameEnd = new Date(lastWeekStart);
  lastWeekSameEnd.setDate(lastWeekSameEnd.getDate() + daysElapsed);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const dayOfMonth = now.getDate();
  const lastMonthSameEnd = new Date(lastMonthStart);
  lastMonthSameEnd.setDate(lastMonthSameEnd.getDate() + dayOfMonth);

  const [thisWeek, lastWeekSame, thisMonth, lastMonthSame] = await Promise.all([
    fetchPeriod(tenant.id, thisWeekStart, tomorrow),
    fetchPeriod(tenant.id, lastWeekStart, lastWeekSameEnd),
    fetchPeriod(tenant.id, thisMonthStart, tomorrow),
    fetchPeriod(tenant.id, lastMonthStart, lastMonthSameEnd),
  ]);

  return NextResponse.json(
    { weekStartDay, thisWeek, lastWeekSame, thisMonth, lastMonthSame },
    { headers: { "Cache-Control": "no-store" } }
  );
}
