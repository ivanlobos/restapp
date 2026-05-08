import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

async function fetchPeriod(from: Date, to: Date) {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["PAID", "PREPARING", "DELIVERED"] },
      createdAt: { gte: from, lt: to },
    },
    select: { tipAmount: true, total: true },
  });

  const totalSales = orders.reduce((s, o) => s + o.total, 0);
  const totalTips  = orders.reduce((s, o) => s + o.tipAmount, 0);
  const salesNoTip = totalSales - totalTips;
  const totalNet   = Math.round(salesNoTip / 1.19);
  const totalIVA   = salesNoTip - totalNet;
  const orderCount = orders.length;
  const avgTicket  = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  return { totalSales, totalNet, totalIVA, totalTips, orderCount, avgTicket };
}

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const weekStartDay = settings?.weekStartDay ?? 1;

  const now      = new Date();
  const tomorrow = startOfDay(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Semana actual: desde el inicio de la semana configurada hasta mañana
  const thisWeekStart = getWeekStart(now, weekStartDay);

  // Semana anterior: misma cantidad de días
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  // Comparativo: mismos N días transcurridos de la semana anterior
  const daysElapsed = Math.floor((now.getTime() - thisWeekStart.getTime()) / 86400000) + 1;
  const lastWeekSameEnd = new Date(lastWeekStart);
  lastWeekSameEnd.setDate(lastWeekSameEnd.getDate() + daysElapsed);

  // Mes actual: día 1 hasta mañana
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Mes anterior: mismos N días transcurridos
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const dayOfMonth = now.getDate();
  const lastMonthSameEnd = new Date(lastMonthStart);
  lastMonthSameEnd.setDate(lastMonthSameEnd.getDate() + dayOfMonth);

  const [thisWeek, lastWeekSame, thisMonth, lastMonthSame] = await Promise.all([
    fetchPeriod(thisWeekStart, tomorrow),
    fetchPeriod(lastWeekStart, lastWeekSameEnd),
    fetchPeriod(thisMonthStart, tomorrow),
    fetchPeriod(lastMonthStart, lastMonthSameEnd),
  ]);

  return NextResponse.json({
    weekStartDay,
    thisWeek,
    lastWeekSame,
    thisMonth,
    lastMonthSame,
  });
}
