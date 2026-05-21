import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/tenant";
import { decrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { items, tableId, orderId, tenantSlug } = await req.json();

    if (!tenantSlug) {
      return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
    }

    const tenant = await getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    // Multi-tenant: cada tenant tiene sus propias credenciales MP
    // 1. Si mpEnabled + mpAccessToken (encriptado AES-256-GCM) → desencriptar y usar
    // 2. Fallback: mercadoPagoToken viejo (sin encriptar, legacy) para retrocompat
    // 3. Sin fallback a env var: si no hay token configurado, error
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
    // Asumimos locale "es" por defecto para back_urls
    const successUrl = `${baseUrl}/es/${tenantSlug}/mesa/${tableId}/gracias?order=${orderId}`;
    const failureUrl = `${baseUrl}/es/${tenantSlug}/mesa/${tableId}/pago`;
    const pendingUrl = `${baseUrl}/es/${tenantSlug}/mesa/${tableId}/pago`;

    const result = await preference.create({
      body: {
        items: items.map((item: { id: string; name: string; quantity: number; price: number }) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: "CLP",
        })),
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        auto_return: "approved",
        external_reference: orderId,
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenantSlug,
          orderId: orderId,
        },
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    console.error("MP Error:", error);
    return NextResponse.json({ error: "Error creando preferencia" }, { status: 500 });
  }
}
