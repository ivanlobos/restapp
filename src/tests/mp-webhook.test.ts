/**
 * Tests del webhook de Mercado Pago (/api/payments/mp-webhook)
 *
 * Estrategia: mockear Prisma, getTenantBySlug y fetch global.
 * Los tests son unitarios — no conectan a BD ni a MP.
 * Se testea la lógica de negocio: firma HMAC, monto, idempotencia.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { encrypt } from "@/lib/crypto";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock de Prisma ANTES de importar el route
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock de getTenantBySlug
vi.mock("@/lib/tenant", () => ({
  getTenantBySlug: vi.fn(),
}));

// Importar DESPUÉS de los mocks
import { POST } from "@/app/api/payments/mp-webhook/route";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = "test-webhook-secret-123";
const ACCESS_TOKEN = "TEST-access-token-mp";
const TENANT_SLUG = "imperial";
const PAYMENT_ID = "987654321";
const ORDER_ID = "order-abc-123";
const ORDER_TOTAL = 15000; // CLP

/** Genera la firma HMAC-SHA256 igual que MP */
function buildSignature(paymentId: string, requestId: string, ts: string, secret: string): string {
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
  return crypto.createHmac("sha256", secret).update(manifest).digest("hex");
}

/** Crea una NextRequest simulada con los headers correctos */
function makeRequest(overrides: {
  paymentId?: string;
  requestId?: string;
  ts?: string;
  secret?: string;
  tenantSlug?: string;
  body?: Record<string, unknown>;
} = {}) {
  const {
    paymentId = PAYMENT_ID,
    requestId = "req-id-001",
    ts = String(Date.now()),
    secret = WEBHOOK_SECRET,
    tenantSlug = TENANT_SLUG,
    body = {},
  } = overrides;

  const hash = buildSignature(paymentId, requestId, ts, secret);

  const url = `http://localhost:3000/api/payments/mp-webhook?tenant=${tenantSlug}&data.id=${paymentId}`;

  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-signature": `ts=${ts},v1=${hash}`,
      "x-request-id": requestId,
    },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

/** Tenant mock con credenciales encriptadas */
function makeTenant() {
  return {
    id: "tenant-id-001",
    slug: TENANT_SLUG,
    isActive: true,
    mpEnabled: true,
    mpWebhookSecret: encrypt(WEBHOOK_SECRET),
    mpAccessToken: encrypt(ACCESS_TOKEN),
    mercadoPagoToken: null,
  };
}

/** Respuesta simulada de MP para un pago aprobado */
function makeMpPayment(overrides: { status?: string; amount?: number } = {}) {
  return {
    id: PAYMENT_ID,
    status: overrides.status ?? "approved",
    external_reference: ORDER_ID,
    transaction_amount: overrides.amount ?? ORDER_TOTAL,
  };
}

/** Orden simulada en BD */
function makeOrder(overrides: { status?: string } = {}) {
  return {
    id: ORDER_ID,
    tenantId: "tenant-id-001",
    total: ORDER_TOTAL,
    status: overrides.status ?? "PENDING",
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/payments/mp-webhook", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // fetch global mockeado para devolver pago aprobado por defecto
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => makeMpPayment(),
    } as Response);
  });

  describe("Validación de firma HMAC", () => {
    it("aprueba y marca PAID cuando la firma es válida", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as never);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });

      const req = makeRequest();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ received: true });
      expect(prisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: ORDER_ID }),
          data: expect.objectContaining({ status: "PAID" }),
        })
      );
    });

    it("rechaza con 401 cuando la firma es incorrecta", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);

      const req = makeRequest({ secret: "wrong-secret" });
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it("rechaza con 401 cuando faltan los headers de firma", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);

      const url = `http://localhost:3000/api/payments/mp-webhook?tenant=${TENANT_SLUG}&data.id=${PAYMENT_ID}`;
      const req = new Request(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }) as unknown as import("next/server").NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe("Validación de monto (seguridad crítica)", () => {
    it("NO actualiza la orden cuando el monto de MP difiere", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as never);
      // MP devuelve un monto distinto al esperado
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => makeMpPayment({ amount: 99999 }), // monto diferente
      } as Response);

      const req = makeRequest();
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.warning).toBe("amount mismatch");
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it("acepta cuando el monto coincide exactamente", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as never);
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 1 });

      const req = makeRequest();
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(prisma.order.updateMany).toHaveBeenCalled();
    });
  });

  describe("Idempotencia", () => {
    it("devuelve 200 sin error si la orden ya estaba PAID", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder({ status: "PAID" }) as never);
      // updateMany no actualiza nada (where excluye órdenes ya PAID)
      vi.mocked(prisma.order.updateMany).mockResolvedValue({ count: 0 });

      const req = makeRequest();
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });
      // Sí se llama (es idempotente vía WHERE), pero count = 0
      expect(prisma.order.updateMany).toHaveBeenCalled();
    });
  });

  describe("Casos de error y edge cases", () => {
    it("devuelve 400 cuando no viene tenant slug", async () => {
      const url = `http://localhost:3000/api/payments/mp-webhook?data.id=${PAYMENT_ID}`;
      const req = new Request(url, { method: "POST", body: "{}" }) as unknown as import("next/server").NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("devuelve 404 cuando el tenant no existe", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(null);

      const req = makeRequest();
      const res = await POST(req);

      expect(res.status).toBe(404);
    });

    it("devuelve 200 received:true cuando la orden no existe en BD", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const req = makeRequest();
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ received: true });
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it("ignora pagos con status distinto de 'approved'", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);
      vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as never);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => makeMpPayment({ status: "pending" }),
      } as Response);

      const req = makeRequest();
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it("bloquea orden de tenant diferente (seguridad cross-tenant)", async () => {
      vi.mocked(getTenantBySlug).mockResolvedValue(makeTenant() as never);
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...makeOrder(),
        tenantId: "otro-tenant-id", // pertenece a otro tenant
      } as never);

      const req = makeRequest();
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });
});
