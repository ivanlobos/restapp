import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tableId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { tenantSlug } = body as { tenantSlug?: string };

  if (!tenantSlug || typeof tenantSlug !== "string") {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const session = await getAdminSession(tenantSlug);
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verificar que la mesa pertenece al tenant
  const table = await prisma.table.findFirst({
    where: { id: tableId, tenantId: session.tenantId },
  });

  if (!table) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  await prisma.table.update({
    where: { id: tableId },
    data: { status: "FREE", releasedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
