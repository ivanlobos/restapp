import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

/**
 * POST /api/settings/password
 * body: { tenantSlug, currentPassword, newPassword }
 *
 * Verifica la contraseña actual con bcrypt.compare,
 * luego hashea la nueva con bcrypt.hash y actualiza Tenant.adminKey.
 *
 * Errores posibles:
 * - 400: campos faltantes o nueva contraseña demasiado corta
 * - 401: sesión inválida o contraseña actual incorrecta
 * - 404: tenant no encontrado
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { tenantSlug, currentPassword, newPassword } = body as {
    tenantSlug?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  // Validaciones básicas
  if (!tenantSlug || typeof tenantSlug !== "string") {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }
  if (!currentPassword || typeof currentPassword !== "string") {
    return NextResponse.json({ error: "Contraseña actual requerida" }, { status: 400 });
  }
  if (!newPassword || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Nueva contraseña requerida" }, { status: 400 });
  }
  if (newPassword.trim().length < 6) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  // Verificar sesión activa
  const session = await getAdminSession(tenantSlug);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Obtener el hash actual del tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, adminKey: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  // Verificar contraseña actual
  const isValid = await bcrypt.compare(currentPassword, tenant.adminKey);
  if (!isValid) {
    return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });
  }

  // Hashear nueva contraseña y actualizar
  const newHash = await bcrypt.hash(newPassword.trim(), 10);
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { adminKey: newHash },
  });

  return NextResponse.json({ ok: true });
}
