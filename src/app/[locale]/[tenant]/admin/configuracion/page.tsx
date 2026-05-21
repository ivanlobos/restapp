import { SettingsClient } from "./SettingsClient";
import { prisma } from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type ConfiguracionPageProps = {
  params: Promise<{ tenant: string }>;
};

export default async function ConfiguracionPage({ params }: ConfiguracionPageProps) {
  const { tenant: tenantSlug } = await params;
  const tenant = await requireTenant(tenantSlug);

  const settings = await prisma.settings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, weekStartDay: 1 },
  });

  // Estado MP (sin tokens en claro)
  const mpStatus = {
    enabled: tenant.mpEnabled,
    hasAccessToken: !!tenant.mpAccessToken,
    hasPublicKey: !!tenant.mpPublicKey,
  };

  // Datos del restaurante (no sensibles)
  const tenantInfo = {
    name: tenant.name,
    address: tenant.address ?? "",
    phone: tenant.phone ?? "",
    email: tenant.email ?? "",
    logoUrl: tenant.logoUrl ?? "",
    legalName: tenant.legalName ?? "",
    taxId: tenant.taxId ?? "",
    currency: tenant.currency,
  };

  return (
    <SettingsClient
      initialWeekStartDay={settings.weekStartDay ?? 1}
      mpStatus={mpStatus}
      tenantInfo={tenantInfo}
    />
  );
}
