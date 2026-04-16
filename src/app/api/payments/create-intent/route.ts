import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const body = await req.json();
  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { table: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Pedido ya procesado" }, { status: 409 });
  }

  // CLP is a zero-decimal currency — amount is in whole pesos, no * 100
  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.total,
    currency: "clp",
    metadata: {
      orderId: order.id,
      tableId: order.tableId,
      tableNumber: order.table.number.toString(),
      customerName: order.customerName,
    },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: {
      stripePaymentId: paymentIntent.id,
      status: "PROCESSING",
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
