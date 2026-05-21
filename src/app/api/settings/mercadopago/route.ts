import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";
import { encrypt, decrypt } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/**
 * Helpers
 */
function mask(token: string | null): string | null {
  if (!token) return null;
  if (token.length <= 12) return "***";
  return `${token.slice(0, 8)}···${token.slice(-4)}`;
}

async function validateMpToken(accessToken: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.status === 200) return { valid: true };
    if (res.status === 401 || res.status === 403) return { valid: false, reason: "El Access Token no es válido o no tiene permisos suficientes" };
    return { valid: false, reason: `Mercado Pago rechazó las credenciales (código ${res.status})` };
  } catch (err) {
    console.error("validateMpToken error:", err);
    return { valid: false, reason: "Error de red validando el token con Mercado Pago" };
  }
}

/**
 * GET /api/settings/mercadopago?tenantSlug=xxx
 * Devuelve estado MP del tenant (sin tokens en claro).
 */
export async function GET(req: NextRequest) {
  const tenantSlug = new URL(req.url).searchParams.get("tenantSlug");
  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const session = await getAdminSession(tenantSlug);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { mpEnabled: true, mpAccessToken: true, mpPublicKey: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  // Desencriptar solo para enmascarar y devolver la máscara
  let accessTokenMask: string | null = null;
  if (tenant.mpAccessToken) {
    try {
      const plain = decrypt(tenant.mpAccessToken);
      accessTokenMask = mask(plain);
    } catch {
      accessTokenMask = "***corruptas***";
    }
  }

  return NextResponse.json({
    mpEnabled: tenant.mpEnabled,
    hasAccessToken: !!tenant.mpAccessToken,
    hasPublicKey: !!tenant.mpPublicKey,
    accessTokenMask,
    publicKeyMask: mask(tenant.mpPublicKey),
  });
}

/**
 * POST /api/settings/mercadopago
 * body: { tenantSlug, accessToken?, publicKey?, enabled? }
 * - Si accessToken viene: lo valida contra MP API y lo encripta
 * - Si publicKey viene: lo guarda en claro (es público por diseño)
 * - Si enabled viene: lo actualiza
 * Campos no presentes en el body no se tocan.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantSlug, accessToken, publicKey, enabled } = body;

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const session = await getAdminSession(tenantSlug);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const update: {
    mpAccessToken?: string;
    mpPublicKey?: string;
    mpEnabled?: boolean;
  } = {};

  if (typeof accessToken === "string" && accessToken.trim().length > 0) {
    const trimmed = accessToken.trim();
    const v = await validateMpToken(trimmed);
    if (!v.valid) {
      return NextResponse.json(
        { error: v.reason ?? "Token inválido" },
        { status: 400 }
      );
    }
    try {
      update.mpAccessToken = encrypt(trimmed);
    } catch (err) {
      console.error("encrypt accessToken error:", err);
      return NextResponse.json(
        { error: "Error encriptando el token" },
        { status: 500 }
      );
    }
  }

  if (typeof publicKey === "string" && publicKey.trim().length > 0) {
    update.mpPublicKey = publicKey.trim();
  }

  if (typeof enabled === "boolean") {
    update.mpEnabled = enabled;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No hay campos para actualizar" },
      { status: 400 }
    );
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: update,
  });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/settings/mercadopago?tenantSlug=xxx
 * Limpia credenciales MP del tenant.
 */
export async function DELETE(req: NextRequest) {
  const tenantSlug = new URL(req.url).searchParams.get("tenantSlug");
  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const session = await getAdminSession(tenantSlug);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      mpAccessToken: null,
      mpPublicKey: null,
      mpEnabled: false,
    },
  });

  return NextResponse.json({ ok: true });
}
