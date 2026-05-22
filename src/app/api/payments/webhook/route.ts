import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Webhook de Stripe no disponible" },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    const metaTenantId = intent.metadata?.tenantId;

    if (orderId) {
      // Validar que la order pertenezca al tenant del metadata (defensa en profundidad)
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order && metaTenantId && order.tenantId !== metaTenantId) {
        console.warn(`Webhook: orderId ${orderId} no pertenece a tenant ${metaTenantId}`);
        return NextResponse.json({ received: true });
      }

      await prisma.order.updateMany({
        where: { id: orderId, status: { not: "PAID" } },
        data: { status: "PAID", paidAt: new Date() },
      });
    }
  }

  return NextResponse.json({ received: true });
}
