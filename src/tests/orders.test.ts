/**
 * Tests de /api/orders (POST — creación de órdenes)
 *
 * Se testea:
 * 1. validateBody: campos requeridos, rangos, formatos
 * 2. Cálculo de subtotal / tip / total en CLP (sin multiplicar por 100)
 * 3. Snapshot de precio: el precio se toma del producto en BD, no del body
 * 4. Casos de error: tenant no encontrado, mesa inválida, producto no disponible
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    table: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    order: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/tenant", () => ({
  getTenantBySlug: vi.fn(),
}));

import { POST } from "@/app/api/orders/route";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT = { id: "t1", slug: "imperial", isActive: true };
const TABLE = { id: "mesa-1", tenantId: "t1", isActive: true };

const PRODUCTS = [
  { id: "p1", name: "Cerveza", price: 3000, tenantId: "t1", isAvailable: true },
  { id: "p2", name: "Pizza", price: 8500, tenantId: "t1", isAvailable: true },
];

/** Body mínimo válido */
function validBody(overrides: Record<string, unknown> = {}) {
  return {
    tenantSlug: "imperial",
    tableId: "mesa-1",
    customerName: "Juan",
    email: null,
    includeTip: true,
    tipPercent: 10,
    items: [{ productId: "p1", quantity: 2 }],
    ...overrides,
  };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Configura los mocks happy-path */
function setupHappyPath(products = PRODUCTS) {
  vi.mocked(getTenantBySlug).mockResolvedValue(TENANT as never);
  vi.mocked(prisma.table.findUnique).mockResolvedValue(TABLE as never);
  vi.mocked(prisma.product.findMany).mockResolvedValue(products as never);
  vi.mocked(prisma.$transaction).mockImplementation(async (fn) => fn(prisma as never));
  vi.mocked(prisma.order.create).mockResolvedValue({
    id: "order-new",
    status: "PENDING",
    table: TABLE,
    items: [],
  } as never);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/orders — Validación de body", () => {
  beforeEach(() => vi.resetAllMocks());

  it("devuelve 400 cuando falta tenantSlug", async () => {
    const { tenantSlug: _, ...body } = validBody();
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/tenantSlug/);
  });

  it("devuelve 400 cuando falta tableId", async () => {
    const { tableId: _, ...body } = validBody();
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/tableId/);
  });

  it("devuelve 400 cuando customerName está vacío", async () => {
    const res = await POST(makeRequest(validBody({ customerName: "" })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/customerName/);
  });

  it("devuelve 400 cuando customerName supera 80 chars", async () => {
    const res = await POST(makeRequest(validBody({ customerName: "a".repeat(81) })));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 cuando items está vacío", async () => {
    const res = await POST(makeRequest(validBody({ items: [] })));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 cuando quantity es 0", async () => {
    const res = await POST(makeRequest(validBody({ items: [{ productId: "p1", quantity: 0 }] })));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 cuando quantity supera 50", async () => {
    const res = await POST(makeRequest(validBody({ items: [{ productId: "p1", quantity: 51 }] })));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 cuando tipPercent está fuera de rango", async () => {
    const res = await POST(makeRequest(validBody({ tipPercent: 31 })));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 cuando email tiene formato inválido", async () => {
    const res = await POST(makeRequest(validBody({ email: "no-es-un-email" })));
    expect(res.status).toBe(400);
  });

  it("acepta email null sin error", async () => {
    setupHappyPath([PRODUCTS[0]]);
    const res = await POST(makeRequest(validBody({ email: null })));
    expect(res.status).toBe(201);
  });

  it("acepta deliveryPreference DRINKS_FIRST", async () => {
    setupHappyPath([PRODUCTS[0]]);
    const res = await POST(makeRequest(validBody({ deliveryPreference: "DRINKS_FIRST" })));
    expect(res.status).toBe(201);
  });

  it("devuelve 400 cuando deliveryPreference es inválido", async () => {
    const res = await POST(makeRequest(validBody({ deliveryPreference: "INVALID" })));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/orders — Cálculo de montos CLP", () => {
  beforeEach(() => vi.resetAllMocks());

  it("calcula subtotal correctamente sin propina", async () => {
    // 2 cervezas × $3.000 = $6.000, sin propina → total = $6.000
    setupHappyPath([PRODUCTS[0]]);

    const res = await POST(makeRequest(validBody({ includeTip: false, tipPercent: 10 })));
    expect(res.status).toBe(201);

    const createCall = vi.mocked(prisma.order.create).mock.calls[0][0];
    expect(createCall.data.subtotal).toBe(6000);   // 2 × 3000
    expect(createCall.data.tipAmount).toBe(0);
    expect(createCall.data.total).toBe(6000);
  });

  it("calcula propina al 10% con Math.round", async () => {
    // 2 cervezas × $3.000 = $6.000 → propina 10% = $600 → total $6.600
    setupHappyPath([PRODUCTS[0]]);

    const res = await POST(makeRequest(validBody({ includeTip: true, tipPercent: 10 })));
    expect(res.status).toBe(201);

    const createCall = vi.mocked(prisma.order.create).mock.calls[0][0];
    expect(createCall.data.subtotal).toBe(6000);
    expect(createCall.data.tipAmount).toBe(600);
    expect(createCall.data.total).toBe(6600);
  });

  it("calcula correctamente con múltiples productos y cantidades", async () => {
    // 2 cervezas × $3.000 = $6.000
    // 1 pizza    × $8.500 = $8.500
    // subtotal = $14.500, propina 10% = $1.450, total = $15.950
    setupHappyPath();

    const items = [
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ];
    const res = await POST(makeRequest(validBody({ items, includeTip: true, tipPercent: 10 })));
    expect(res.status).toBe(201);

    const createCall = vi.mocked(prisma.order.create).mock.calls[0][0];
    expect(createCall.data.subtotal).toBe(14500);
    expect(createCall.data.tipAmount).toBe(1450);
    expect(createCall.data.total).toBe(15950);
  });

  it("snapshot de precio: usa el precio de BD, no del cliente", async () => {
    // El precio viene de prisma.product.findMany, no del body del cliente.
    // Aunque el body no trae precio, el sistema toma $3.000 de BD.
    setupHappyPath([PRODUCTS[0]]);

    const res = await POST(makeRequest(validBody({ includeTip: false })));
    expect(res.status).toBe(201);

    const createCall = vi.mocked(prisma.order.create).mock.calls[0][0];
    const createdItem = createCall.data.items.create[0];
    expect(createdItem.unitPrice).toBe(3000); // precio de BD, no manipulable
  });
});

describe("POST /api/orders — Casos de error de BD", () => {
  beforeEach(() => vi.resetAllMocks());

  it("devuelve 404 cuando el tenant no existe", async () => {
    vi.mocked(getTenantBySlug).mockResolvedValue(null);

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(404);
  });

  it("devuelve 404 cuando la mesa no existe", async () => {
    vi.mocked(getTenantBySlug).mockResolvedValue(TENANT as never);
    vi.mocked(prisma.table.findUnique).mockResolvedValue(null);

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(404);
  });

  it("devuelve 404 cuando la mesa pertenece a otro tenant", async () => {
    vi.mocked(getTenantBySlug).mockResolvedValue(TENANT as never);
    vi.mocked(prisma.table.findUnique).mockResolvedValue({
      ...TABLE,
      tenantId: "otro-tenant",
    } as never);

    const res = await POST(makeRequest(validBody()));
    expect(res.status).toBe(404);
  });

  it("devuelve 400 cuando algún producto no está disponible", async () => {
    vi.mocked(getTenantBySlug).mockResolvedValue(TENANT as never);
    vi.mocked(prisma.table.findUnique).mockResolvedValue(TABLE as never);
    // Solo devuelve 1 producto de 2 solicitados
    vi.mocked(prisma.product.findMany).mockResolvedValue([PRODUCTS[0]] as never);

    const items = [
      { productId: "p1", quantity: 1 },
      { productId: "p-inexistente", quantity: 1 },
    ];
    const res = await POST(makeRequest(validBody({ items })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/disponibles/);
  });
});
