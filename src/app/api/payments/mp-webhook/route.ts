import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { decrypt } from "@/lib/crypto";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Webhook de Mercado Pago.
 *
 * URL pública: /api/payments/mp-webhook?tenant=<slug>
 *
 * MP envía aquí notificaciones cuando un pago cambia de estado.
 * Este endpoint:
 *   1. Valida que la notificación venga firmada por MP (HMAC-SHA256).
 *   2. Consulta a MP el detalle real del pago (no confía en el body).
 *   3. Valida que el monto coincida con el pedido en BD.
 *   4. Marca el pedido como PAID solo si todo cuadra.
 *
 * Multi-tenant: cada tenant tiene su propio mpWebhookSecret y mpAccessToken,
 * ambos encriptados en BD con AES-256-GCM.
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenantSlug = url.searchParams.get("tenant");

    const paymentIdFromQuery =
      url.searchParams.get("data.id") || url.searchParams.get("id");

    let body: { type?: string; action?: string; data?: { id?: string } } = {};
    try {
      body = await req.json();
    } catch {
      // body vacío o no JSON: válido si el id viene en query
    }

    const paymentId = paymentIdFromQuery || body?.data?.id;

    if (!tenantSlug) {
      console.warn("[mp-webhook] tenant slug ausente");
      return NextResponse.json({ error: "tenant requerido" }, { status: 400 });
    }

    if (!paymentId) {
      console.warn("[mp-webhook] payment id ausente");
      return NextResponse.json({ error: "payment id requerido" }, { status: 400 });
    }

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      console.warn(`[mp-webhook] tenant ${tenantSlug} no encontrado`);
      return NextResponse.json({ error: "tenant no encontrado" }, { status: 404 });
    }

    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!xSignature || !xRequestId) {
      console.warn(`[mp-webhook] headers de firma ausentes (tenant=${tenant.slug})`);
      return NextResponse.json({ error: "headers de firma requeridos" }, { status: 401 });
    }

    const sigParts: Record<string, string> = {};
    for (const part of xSignature.split(",")) {
      const [k, v] = part.split("=").map((s) => s.trim());
      if (k && v) sigParts[k] = v;
    }
    const ts = sigParts.ts;
    const receivedHash = sigParts.v1;

    if (!ts || !receivedHash) {
      console.warn(`[mp-webhook] x-signature malformado (tenant=${tenant.slug})`);
      return NextResponse.json({ error: "firma malformada" }, { status: 401 });
    }

    if (!tenant.mpWebhookSecret) {
      console.error(`[mp-webhook] tenant ${tenant.slug} sin mpWebhookSecret configurado`);
      return NextResponse.json({ error: "webhook no configurado" }, { status: 500 });
    }

    let webhookSecret: string;
    try {
      webhookSecret = decrypt(tenant.mpWebhookSecret);
    } catch (err) {
      console.error(`[mp-webhook] error desencriptando mpWebhookSecret de tenant ${tenant.slug}`, err);
      return NextResponse.json({ error: "secret corrupto" }, { status: 500 });
    }

    const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
    const expectedHash = crypto.createHmac("sha256", webhookSecret).update(manifest).digest("hex");

    const expectedBuf = Buffer.from(expectedHash, "hex");
    const receivedBuf = Buffer.from(receivedHash, "hex");

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      console.warn(`[mp-webhook] firma invalida (tenant=${tenant.slug}, payment=${paymentId})`);
      return NextResponse.json({ error: "firma invalida" }, { status: 401 });
    }

    let accessToken: string | null = null;
    if (tenant.mpEnabled && tenant.mpAccessToken) {
      try {
        accessToken = decrypt(tenant.mpAccessToken);
      } catch (err) {
        console.error(`[mp-webhook] error desencriptando mpAccessToken de tenant ${tenant.slug}`, err);
        return NextResponse.json({ error: "credenciales corruptas" }, { status: 500 });
      }
    } else if (tenant.mercadoPagoToken) {
      accessToken = tenant.mercadoPagoToken;
    }

    if (!accessToken) {
      console.error(`[mp-webhook] tenant ${tenant.slug} sin access token MP`);
      return NextResponse.json({ received: true, warning: "no token" });
    }

    let mpRes: Response;
    try {
      mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.error(`[mp-webhook] error de red consultando pago ${paymentId}`, err);
      return NextResponse.json({ error: "error consultando MP" }, { status: 500 });
    }

    if (!mpRes.ok) {
      console.error(`[mp-webhook] MP devolvio ${mpRes.status} para pago ${paymentId} (tenant=${tenant.slug})`);
      return NextResponse.json({ received: true, warning: `mp returned ${mpRes.status}` });
    }

    const payment = await mpRes.json();
    const status: string | undefined = payment.status;
    const externalReference: string | undefined = payment.external_reference;
    const amount: number | undefined = payment.transaction_amount;

    if (!externalReference) {
      console.warn(`[mp-webhook] pago ${paymentId} sin external_reference (tenant=${tenant.slug})`);
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({ where: { id: externalReference } });

    if (!order) {
      console.warn(`[mp-webhook] orderId ${externalReference} no encontrado (tenant=${tenant.slug})`);
      return NextResponse.json({ received: true });
    }

    if (order.tenantId !== tenant.id) {
      console.warn(`[mp-webhook] orderId ${externalReference} NO pertenece a tenant ${tenant.slug}`);
      return NextResponse.json({ received: true });
    }

    if (typeof amount !== "number" || Math.round(amount) !== order.total) {
      console.error(`[mp-webhook] monto NO coincide. order=${order.id} order.total=${order.total} mp.amount=${amount}`);
      return NextResponse.json({ received: true, warning: "amount mismatch" });
    }

    if (status === "approved") {
      const updated = await prisma.order.updateMany({
        where: { id: order.id, status: { not: "PAID" } },
        data: { status: "PAID", paidAt: new Date() },
      });

      if (updated.count > 0) {
        console.log(`[mp-webhook] order ${order.id} marcada PAID (tenant=${tenant.slug})`);
      } else {
        console.log(`[mp-webhook] order ${order.id} ya estaba PAID (idempotente)`);
      }
    } else {
      console.log(`[mp-webhook] order ${order.id} pago en estado '${status}', no se actualiza`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[mp-webhook] error inesperado", error);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }
}
