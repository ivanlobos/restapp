import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const table = await prisma.table.findUnique({ where: { id } });
  if (!table) return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  return NextResponse.json(table);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const table = await prisma.table.update({
    where: { id },
    data: {
      label: body.label,
      isActive: body.isActive,
    },
  });
  return NextResponse.json(table);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.table.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
