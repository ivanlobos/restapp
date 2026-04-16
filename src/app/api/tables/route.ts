import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
  });
  return NextResponse.json(tables);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { number, label } = body;

  if (!number || typeof number !== "number") {
    return NextResponse.json({ error: "Número de mesa requerido" }, { status: 400 });
  }

  const existing = await prisma.table.findUnique({ where: { number } });
  if (existing) {
    return NextResponse.json({ error: "Número de mesa ya existe" }, { status: 409 });
  }

  const table = await prisma.table.create({
    data: { number, label: label || null },
  });
  return NextResponse.json(table, { status: 201 });
}
