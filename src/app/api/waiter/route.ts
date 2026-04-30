import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { tableId } = await req.json();
    if (!tableId) return NextResponse.json({ error: "tableId requerido" }, { status: 400 });

    const notification = await prisma.waiterCall.create({
      data: { tableId, status: "PENDING" },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Waiter call error:", error);
    return NextResponse.json({ error: "Error llamando al garzón" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const calls = await prisma.waiterCall.findMany({
      where: { status: "PENDING" },
      include: { table: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(calls);
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();
    await prisma.waiterCall.update({
      where: { id },
      data: { status: "ATTENDED" },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
