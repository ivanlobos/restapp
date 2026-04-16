import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(_req: Request, { params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) {
    return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/mesa/${tableId}`;

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
