import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const ALLOWED_CURRENCIES = ["CLP", "USD", "EUR", "ARS", "PEN", "MXN"] as const;
type Currency = (typeof ALLOWED_CURRENCIES)[number];

function isValidEmail(s: string): boolean {
  // Validación básica, no exhaustiva
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Normaliza string opcional: trim → si vacío, null. */
function normalizeOptional(v: unknown): string | null | undefined {
  if (v === undefined) return undefined; // no tocar
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * GET /api/settings/tenant?tenantSlug=xxx
 * Devuelve datos del restaurante.
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
    select: {
      name: true,
      address: true,
      phone: true,
      email: true,
      logoUrl: true,
      legalName: true,
      taxId: true,
      currency: true,
    },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

/**
 * POST /api/settings/tenant
 * body: { tenantSlug, name?, address?, phone?, email?, logoUrl?, legalName?, taxId?, currency? }
 * - name: si viene, no puede ser vacío
 * - email: si viene no vacío, debe ser email válido
 * - logoUrl: si viene no vacío, debe ser URL http(s) válida
 * - currency: si viene, debe estar en whitelist
 * - resto: trim, vacío -> null
 * Campos no presentes en el body no se tocan.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantSlug } = body;

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const session = await getAdminSession(tenantSlug);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const update: {
    name?: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
    legalName?: string | null;
    taxId?: string | null;
    currency?: Currency;
  } = {};

  // name: required si viene
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "El nombre no puede estar vacío" },
        { status: 400 }
      );
    }
    update.name = body.name.trim();
  }

  // email: validar formato si no es vacío
  if (body.email !== undefined) {
    const norm = normalizeOptional(body.email);
    if (norm && !isValidEmail(norm)) {
      return NextResponse.json(
        { error: "Email con formato inválido" },
        { status: 400 }
      );
    }
    update.email = norm ?? null;
  }

  // logoUrl: validar URL si no es vacío
  if (body.logoUrl !== undefined) {
    const norm = normalizeOptional(body.logoUrl);
    if (norm && !isValidUrl(norm)) {
      return NextResponse.json(
        { error: "El logo debe ser una URL http(s) válida" },
        { status: 400 }
      );
    }
    update.logoUrl = norm ?? null;
  }

  // currency: whitelist
  if (body.currency !== undefined) {
    if (
      typeof body.currency !== "string" ||
      !ALLOWED_CURRENCIES.includes(body.currency as Currency)
    ) {
      return NextResponse.json(
        {
          error: `Moneda no soportada. Permitidas: ${ALLOWED_CURRENCIES.join(", ")}`,
        },
        { status: 400 }
      );
    }
    update.currency = body.currency as Currency;
  }

  // Campos libres: trim, vacío -> null
  for (const key of ["address", "phone", "legalName", "taxId"] as const) {
    if (body[key] !== undefined) {
      update[key] = normalizeOptional(body[key]) ?? null;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No hay campos para actualizar" },
      { status: 400 }
    );
  }

  const updated = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: update,
    select: {
      name: true,
      address: true,
      phone: true,
      email: true,
      logoUrl: true,
      legalName: true,
      taxId: true,
      currency: true,
    },
  });

  return NextResponse.json(updated);
}
