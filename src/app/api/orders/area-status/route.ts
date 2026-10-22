import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

// GET /api/orders/area-status?tenantSlug=imperial
// Retorna conteo de pedidos activos por área (KITCHEN / BAR)
export async function GET(req: NextRequest) {
  try {
    const tenantSlug = new URL(req.url).searchParams.get("tenantSlug");
    if (!tenantSlug) return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });

    const session = await getAdminSession(tenantSlug);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: {
        tenantId: session.tenantId,
        status: { in: ["PENDING", "PROCESSING", "PAID", "PREPARING"] },
      },
      include: {
        items: {
          include: { product: { include: { category: true } } },
        },
      },
    });

    const result = {
      kitchen: { pending: 0, preparing: 0 },
      bar: { pending: 0, preparing: 0 },
    };

    for (const order of orders) {
      const isPreparing = order.status === "PREPARING";
      const hasCocina = order.items.some((i) =>
        ["KITCHEN", "ALL"].includes(i.product.category?.area ?? "ALL")
      );
      const hasBar = order.items.some((i) =>
        ["BAR", "ALL"].includes(i.product.category?.area ?? "ALL")
      );

      if (hasCocina) {
        if (isPreparing) result.kitchen.preparing++;
        else result.kitchen.pending++;
      }
      if (hasBar) {
        if (isPreparing) result.bar.preparing++;
        else result.bar.pending++;
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("area-status error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
