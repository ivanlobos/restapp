import { prisma } from "@/lib/prisma";
import { cache } from "react";
import type { Tenant } from "@prisma/client";

/**
 * Busca un tenant por su slug. Devuelve null si no existe o está inactivo.
 * Cacheado por request: múltiples llamadas con el mismo slug en una request
 * solo hacen 1 query a la DB.
 */
export const getTenantBySlug = cache(
  async (slug: string): Promise<Tenant | null> => {
    if (!slug) return null;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant || !tenant.isActive) return null;

    return tenant;
  }
);

/**
 * Valida una adminKey contra el tenant correspondiente.
 * Devuelve el tenant si la key matchea, null si no.
 */
export async function getTenantByAdminKey(
  slug: string,
  adminKey: string | null | undefined
): Promise<Tenant | null> {
  if (!slug || !adminKey) return null;

  const tenant = await getTenantBySlug(slug);
  if (!tenant) return null;

  if (tenant.adminKey !== adminKey) return null;

  return tenant;
}

/**
 * Helper para usar en server components/pages: resuelve el tenant o tira 404.
 * Importar `notFound` desde 'next/navigation' en el caller si necesitás
 * manejar el null vos mismo.
 */
export async function requireTenant(slug: string): Promise<Tenant> {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    // Importamos notFound dinámicamente para no romper si esto se usa en otro contexto
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return tenant!;
}
