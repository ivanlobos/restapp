import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";

// GET /api/orders/kiosk?tenantSlug=imperial&area=KITCHEN|BAR
// Retorna pedidos activos filtrados por área de categoría.
// Requiere sesión admin válida.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get("tenantSlug");
    const area = searchParams.get("area"); // "KITCHEN" | "BAR"

    if (!tenantSlug || !area) {
      return NextResponse.json({ error: "tenantSlug y area son requeridos" }, { status: 400 });
    }

    const session = await getAdminSession(tenantSlug);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const areaFilter = area === "KITCHEN" ? ["KITCHEN", "ALL"] : ["BAR", "ALL"];

    const orders = await prisma.order.findMany({
      where: {
        tenantId: session.tenantId,
        status: { in: ["PENDING", "PROCESSING", "PAID", "PREPARING"] },
      },
      orderBy: { createdAt: "asc" }, // más antiguos primero en kiosk
      include: {
        table: true,
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
      },
    });

    // Filtrar ítems por área y excluir pedidos sin ítems relevantes
    const filtered = orders
      .map((order) => ({
        ...order,
        items: order.items.filter((item) =>
          areaFilter.includes(item.product.category?.area ?? "ALL")
        ),
      }))
      .filter((order) => order.items.length > 0);

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("orders/kiosk error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
