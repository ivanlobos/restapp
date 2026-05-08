import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(settings ?? { id: "singleton", weekStartDay: 1 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { weekStartDay } = body;
  if (typeof weekStartDay !== "number" || weekStartDay < 0 || weekStartDay > 6) {
    return NextResponse.json({ error: "Valor invalido" }, { status: 400 });
  }
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: { weekStartDay },
    create: { id: "singleton", weekStartDay },
  });
  return NextResponse.json(settings);
}
