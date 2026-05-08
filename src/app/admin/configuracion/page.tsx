export const dynamic = "force-dynamic";
import { SettingsClient } from "./SettingsClient";
import { prisma } from "@/lib/prisma";

export default async function ConfiguracionPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  return <SettingsClient initialWeekStartDay={settings?.weekStartDay ?? 1} />;
}
