import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getTenantBySlug } from "@/lib/tenant";

export async function POST(req: Request) {
  const body = await req.json();
  const { orderId, tenantSlug } = body;

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }
  if (!orderId) {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { table: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Validar que el pedido pertenezca al tenant
  if (order.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Pedido no pertenece al tenant" }, { status: 403 });
  }

  if (order.status !== "PENDING") {
    return NextResponse.json({ error: "Pedido ya procesado" }, { status: 409 });
  }

  // CLP is a zero-decimal currency - amount is in whole pesos, no * 100
  const paymentIntent = await stripe.paymentIntents.create({
    amount: order.total,
    currency: "clp",
    metadata: {
      tenantId: tenant.id,
      tenantSlug: tenantSlug,
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
