import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import QRCode from "qrcode";

export async function GET(req: Request, { params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");
  const locale = searchParams.get("locale") ?? "es";

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || table.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/${locale}/${tenantSlug}/mesa/${tableId}`;

  const buffer = await QRCode.toBuffer(url, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="mesa-${table.number}.png"`,
      "Cache-Control": "no-cache",
    },
  });
}
