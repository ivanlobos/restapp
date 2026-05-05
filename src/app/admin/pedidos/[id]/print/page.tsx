import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCLP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { table: true, items: { include: { product: true } } },
  });

  if (!order) notFound();

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: monospace; font-size: 14px; padding: 16px; max-width: 300px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .big { font-size: 18px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .item-name { font-size: 15px; font-weight: bold; }
        .qty { font-size: 22px; font-weight: bold; margin-right: 8px; }
        @media print {
          button { display: none !important; }
        }
      `}</style>

      <div className="center bold big" style={{ marginBottom: 4 }}>
        *** COMANDA ***
      </div>
      <div className="center" style={{ marginBottom: 8 }}>
        {new Date(order.createdAt).toLocaleString("es-CL", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        })}
      </div>

      <div className="divider" />

      <div className="row">
        <span className="bold">Mesa:</span>
        <span className="bold big">
          {order.table.number}{order.table.label ? ` · ${order.table.label}` : ""}
        </span>
      </div>
      <div className="row">
        <span className="bold">Cliente:</span>
        <span>{order.customerName}</span>
      </div>

      <div className="divider" />

      <div style={{ marginBottom: 8 }}>
        {order.items.map((item) => (
          <div key={item.id} style={{ display: "flex", alignItems: "center", margin: "6px 0" }}>
            <span className="qty">{item.quantity}x</span>
            <span className="item-name">{item.product.name}</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="center" style={{ marginTop: 8, fontSize: 12 }}>
        RestaurantApp · {order.id.slice(-6).toUpperCase()}
      </div>

      {/* Botón imprimir — se oculta al imprimir */}
      <button
        onClick={() => window.print()}
        style={{
          marginTop: 20,
          width: "100%",
          padding: "10px",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          cursor: "pointer"
        }}
      >
        🖨️ Imprimir
      </button>
    </>
  );
}