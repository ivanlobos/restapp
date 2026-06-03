import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/tenant";
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { orderId, tenantSlug } = await req.json();

    if (!tenantSlug || typeof tenantSlug !== "string") {
      return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
    }
    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
    }

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    // Cargar pedido REAL desde BD (no confiar en precios del cliente)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Defensa en profundidad: el pedido debe pertenecer al tenant del slug
    if (order.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Pedido no pertenece a este tenant" }, { status: 403 });
    }

    if (order.items.length === 0) {
      return NextResponse.json({ error: "Pedido sin items" }, { status: 400 });
    }

    // Multi-tenant: cada tenant tiene sus propias credenciales MP
    let accessToken: string | null = null;
    if (tenant.mpEnabled && tenant.mpAccessToken) {
      try {
        accessToken = decrypt(tenant.mpAccessToken);
      } catch (err) {
        console.error("MP: error desencriptando token de tenant", tenant.slug, err);
        return NextResponse.json(
          { error: "Credenciales MP corruptas. Contacta al administrador." },
          { status: 500 }
        );
      }
    } else if (tenant.mercadoPagoToken) {
      accessToken = tenant.mercadoPagoToken;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "MercadoPago no configurado para este restaurante" },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const tableId = order.tableId;
    const successUrl = `${baseUrl}/es/${tenantSlug}/mesa/${tableId}/gracias?order=${order.id}`;
    const failureUrl = `${baseUrl}/es/${tenantSlug}/mesa/${tableId}/pago`;
    const pendingUrl = `${baseUrl}/es/${tenantSlug}/mesa/${tableId}/pago`;

    // Items construidos desde BD: precios CONGELADOS al momento de crear el pedido
    // El cliente NO puede manipular estos valores
    const mpItems = order.items.map((item) => ({
      id: item.productId,
      title: item.product.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      currency_id: "CLP",
    }));

    // Incluir propina como item separado si aplica
    if (order.includeTip && order.tipAmount > 0) {
      mpItems.push({
        id: "tip",
        title: "Propina",
        quantity: 1,
        unit_price: order.tipAmount,
        currency_id: "CLP",
      });
    }

    const result = await preference.create({
      body: {
        items: mpItems,
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        ...(baseUrl.startsWith('https') ? { auto_return: 'approved' as const } : {}),
        notification_url: `${baseUrl}/api/payments/mp-webhook?tenant=${tenantSlug}`,
        external_reference: order.id,
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenantSlug,
          orderId: order.id,
        },
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    console.error("MP Error:", error);
    return NextResponse.json({ error: "Error creando preferencia" }, { status: 500 });
  }
}
