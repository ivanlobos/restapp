import { Sidebar } from "@/components/admin/Sidebar";
import { WaiterCalls } from "@/components/admin/WaiterCalls";
import { getTenantBySlug } from "@/lib/tenant";
import { getAdminSession } from "@/lib/admin-session";
import { notFound, redirect } from "next/navigation";

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; tenant: string }>;
};

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale, tenant: tenantSlug } = await params;

  // Leer sesión desde cookie httpOnly
  const session = await getAdminSession(tenantSlug);
  if (!session) {
    redirect(`/${locale}/${tenantSlug}/admin-login`);
  }

  // Verificar que el tenant siga existiendo y activo
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <WaiterCalls />
      <main className="md:ml-56 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
