import { getTenantBySlug } from "@/lib/tenant";
import { notFound } from "next/navigation";

type TenantLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ tenant: string; locale: string }>;
};

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return <>{children}</>;
}
