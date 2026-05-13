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

  return <SettingsClient initialWeekStartDay={settings.weekStartDay ?? 1} />;
}
