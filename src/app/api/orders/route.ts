import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcTip } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tableId = searchParams.get("tableId");
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (tableId) where.tableId = tableId;
  if (status) where.status = { in: status.split(",") };
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.createdAt = { gte: d, lt: next };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { product: true } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tableId, customerName, items, includeTip } = body;

  if (!tableId || !customerName || !items || items.length === 0) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isActive) {
    return NextResponse.json({ error: "Mesa no válida" }, { status: 404 });
  }

  // Fetch products to validate prices
  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isAvailable: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Algunos productos no están disponibles" }, { status: 400 });
  }

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItems = items.map((item: { productId: string; quantity: number }) => {
    const product = productMap[item.productId];
    const itemSubtotal = product.price * item.quantity;
    subtotal += itemSubtotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: itemSubtotal,
    };
  });

  const tipAmount = includeTip ? calcTip(subtotal) : 0;
  const total = subtotal + tipAmount;

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        tableId,
        customerName,
        subtotal,
        tipAmount,
        total,
        includeTip: !!includeTip,
        items: { create: orderItems },
      },
      include: {
        table: true,
        items: { include: { product: true } },
      },
    });
    return newOrder;
  });

  return NextResponse.json(order, { status: 201 });
}
