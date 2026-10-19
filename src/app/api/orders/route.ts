import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcTip } from "@/lib/utils";
import { getTenantBySlug } from "@/lib/tenant";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ValidatedBody = {
  tenantSlug: string;
  tableId: string;
  customerName: string;
  email: string | null;
  includeTip: boolean;
  tipPercent: number;
  items: { productId: string; quantity: number }[];
  deliveryPreference: string | null;
};

function validateBody(body: unknown): { ok: true; data: ValidatedBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body inválido" };
  const b = body as Record<string, unknown>;

  if (typeof b.tenantSlug !== "string" || b.tenantSlug.length === 0) {
    return { ok: false, error: "tenantSlug requerido" };
  }
  if (typeof b.tableId !== "string" || b.tableId.length === 0) {
    return { ok: false, error: "tableId requerido" };
  }
  if (typeof b.customerName !== "string") {
    return { ok: false, error: "customerName requerido" };
  }
  const customerName = b.customerName.trim();
  if (customerName.length < 1 || customerName.length > 80) {
    return { ok: false, error: "customerName debe tener entre 1 y 80 caracteres" };
  }

  let email: string | null = null;
  if (b.email !== undefined && b.email !== null && b.email !== "") {
    if (typeof b.email !== "string") return { ok: false, error: "email inválido" };
    const e = b.email.trim();
    if (e.length > 120 || !EMAIL_RE.test(e)) {
      return { ok: false, error: "email con formato inválido" };
    }
    email = e;
  }

  const includeTip = typeof b.includeTip === "boolean" ? b.includeTip : false;

  let tipPercent = 10;
  if (b.tipPercent !== undefined && b.tipPercent !== null) {
    if (typeof b.tipPercent !== "number" || !Number.isFinite(b.tipPercent)) {
      return { ok: false, error: "tipPercent inválido" };
    }
    if (b.tipPercent < 0 || b.tipPercent > 30) {
      return { ok: false, error: "tipPercent debe estar entre 0 y 30" };
    }
    tipPercent = b.tipPercent;
  }

  if (!Array.isArray(b.items)) return { ok: false, error: "items debe ser un array" };
  if (b.items.length < 1 || b.items.length > 100) {
    return { ok: false, error: "items debe tener entre 1 y 100 elementos" };
  }

  const items: { productId: string; quantity: number }[] = [];
  for (let i = 0; i < b.items.length; i++) {
    const it = b.items[i];
    if (!it || typeof it !== "object") return { ok: false, error: `item ${i} inválido` };
    const ito = it as Record<string, unknown>;
    if (typeof ito.productId !== "string" || ito.productId.length === 0) {
      return { ok: false, error: `item ${i}: productId inválido` };
    }
    if (typeof ito.quantity !== "number" || !Number.isInteger(ito.quantity)) {
      return { ok: false, error: `item ${i}: quantity debe ser entero` };
    }
    if (ito.quantity < 1 || ito.quantity > 50) {
      return { ok: false, error: `item ${i}: quantity debe estar entre 1 y 50` };
    }
    items.push({ productId: ito.productId, quantity: ito.quantity });
  }

  const VALID_PREFERENCES = ["DRINKS_FIRST", "TOGETHER"];
  let deliveryPreference: string | null = null;
  if (b.deliveryPreference !== undefined && b.deliveryPreference !== null && b.deliveryPreference !== "") {
    if (typeof b.deliveryPreference !== "string" || !VALID_PREFERENCES.includes(b.deliveryPreference)) {
      return { ok: false, error: "deliveryPreference inválido" };
    }
    deliveryPreference = b.deliveryPreference;
  }

  return {
    ok: true,
    data: {
      tenantSlug: b.tenantSlug,
      tableId: b.tableId,
      customerName,
      email,
      includeTip,
      tipPercent,
      items,
      deliveryPreference,
    },
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");
  const tableId = searchParams.get("tableId");
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  if (!tenantSlug) {
    return NextResponse.json({ error: "tenantSlug requerido" }, { status: 400 });
  }
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const where: Record<string, unknown> = { tenantId: tenant.id };
  if (tableId) where.tableId = tableId;
  if (status) where.status = { in: status.split(",") };
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    where.createdAt = { gte: d, lt: next };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { product: true } },
    },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const v = validateBody(body);
  if (!v.ok) {
    return NextResponse.json({ error: v.error }, { status: 400 });
  }

  const { tenantSlug, tableId, customerName, email, includeTip, tipPercent, items, deliveryPreference } = v.data;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isActive || table.tenantId !== tenant.id) {
    return NextResponse.json({ error: "Mesa no válida" }, { status: 404 });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, tenantId: tenant.id, isAvailable: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Algunos productos no están disponibles" }, { status: 400 });
  }

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItems = items.map((item) => {
    const product = productMap[item.productId];
    const itemSubtotal = product.price * item.quantity;
    subtotal += itemSubtotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: itemSubtotal,
    };
  });

  const tipAmount = includeTip ? calcTip(subtotal, tipPercent) : 0;
  const total = subtotal + tipAmount;

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        tenantId: tenant.id,
        tableId,
        customerName,
        email: email ?? null,
        subtotal,
        tipAmount,
        total,
        includeTip,
        deliveryPreference: deliveryPreference ?? null,
        items: { create: orderItems },
      },
      include: {
        table: true,
        items: { include: { product: true } },
      },
    });
    return newOrder;
  });

  return NextResponse.json(order, { status: 201 });
}