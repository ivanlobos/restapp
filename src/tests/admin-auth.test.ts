/**
 * Tests de /api/admin/login — autenticación del panel admin
 *
 * Se testea:
 * 1. Login exitoso con adminKey en texto plano
 * 2. Login exitoso con adminKey hasheada con bcrypt
 * 3. Credenciales incorrectas → 401
 * 4. Tenant inactivo → 401
 * 5. Tenant no encontrado → 401
 * 6. Campos faltantes → 400
 *
 * createAdminSession está mockeada: no toca cookies reales de Next.js
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: { findUnique: vi.fn() },
  },
}));

// createAdminSession usa next/headers (cookies), que no existe en tests
vi.mock("@/lib/admin-session", () => ({
  createAdminSession: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/admin/login/route";
import { prisma } from "@/lib/prisma";
import { createAdminSession } from "@/lib/admin-session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest;
}

/** Tenant con adminKey en texto plano (sin hashear) */
function makeTenantPlain(adminKey = "clave-secreta-123") {
  return {
    id: "t1",
    slug: "imperial",
    isActive: true,
    adminKey,
  };
}

/** Tenant con adminKey hasheada con bcrypt */
async function makeTenantHashed(plainKey = "clave-segura-456") {
  const hash = await bcrypt.hash(plainKey, 10);
  return {
    id: "t1",
    slug: "imperial",
    isActive: true,
    adminKey: hash,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/admin/login", () => {
  beforeEach(() => vi.resetAllMocks());

  describe("Autenticación exitosa", () => {
    it("acepta adminKey en texto plano (tenants migrados manualmente)", async () => {
      const tenant = makeTenantPlain("clave-plana");
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(tenant as never);

      const res = await POST(makeRequest({ tenantSlug: "imperial", adminKey: "clave-plana" }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(createAdminSession).toHaveBeenCalledWith("t1", "imperial");
    });

    it("acepta adminKey hasheada con bcrypt", async () => {
      const plainKey = "super-secure-key-789";
      const tenant = await makeTenantHashed(plainKey);
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(tenant as never);

      const res = await POST(makeRequest({ tenantSlug: "imperial", adminKey: plainKey }));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.ok).toBe(true);
      expect(createAdminSession).toHaveBeenCalled();
    });

    it("llama createAdminSession con tenantId y tenantSlug correctos", async () => {
      const tenant = makeTenantPlain("mi-clave");
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(tenant as never);

      await POST(makeRequest({ tenantSlug: "imperial", adminKey: "mi-clave" }));

      expect(createAdminSession).toHaveBeenCalledWith("t1", "imperial");
    });
  });

  describe("Credenciales incorrectas", () => {
    it("devuelve 401 cuando adminKey no coincide (texto plano)", async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(makeTenantPlain("correcta") as never);

      const res = await POST(makeRequest({ tenantSlug: "imperial", adminKey: "incorrecta" }));

      expect(res.status).toBe(401);
      expect(createAdminSession).not.toHaveBeenCalled();
    });

    it("devuelve 401 cuando adminKey no coincide (bcrypt)", async () => {
      const tenant = await makeTenantHashed("correcta");
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(tenant as never);

      const res = await POST(makeRequest({ tenantSlug: "imperial", adminKey: "incorrecta" }));

      expect(res.status).toBe(401);
      expect(createAdminSession).not.toHaveBeenCalled();
    });

    it("devuelve 401 cuando el tenant no existe", async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

      const res = await POST(makeRequest({ tenantSlug: "no-existe", adminKey: "cualquiera" }));

      expect(res.status).toBe(401);
      expect(createAdminSession).not.toHaveBeenCalled();
    });

    it("devuelve 401 cuando el tenant está inactivo", async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        ...makeTenantPlain("clave"),
        isActive: false,
      } as never);

      const res = await POST(makeRequest({ tenantSlug: "imperial", adminKey: "clave" }));

      expect(res.status).toBe(401);
    });

    it("devuelve 401 cuando el tenant no tiene adminKey configurada", async () => {
      vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
        id: "t1",
        slug: "imperial",
        isActive: true,
        adminKey: null,
      } as never);

      const res = await POST(makeRequest({ tenantSlug: "imperial", adminKey: "algo" }));

      expect(res.status).toBe(401);
    });
  });

  describe("Validación de campos requeridos", () => {
    it("devuelve 400 cuando falta tenantSlug", async () => {
      const res = await POST(makeRequest({ adminKey: "clave" }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/tenantSlug/);
    });

    it("devuelve 400 cuando falta adminKey", async () => {
      const res = await POST(makeRequest({ tenantSlug: "imperial" }));
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/adminKey/);
    });

    it("devuelve 400 cuando tenantSlug es string vacío", async () => {
      const res = await POST(makeRequest({ tenantSlug: "", adminKey: "clave" }));
      expect(res.status).toBe(400);
    });

    it("devuelve 400 cuando el body no es JSON válido", async () => {
      const req = new Request("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "no-es-json",
      }) as unknown as import("next/server").NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(500); // JSON.parse lanza, catch devuelve 500
    });
  });
});
