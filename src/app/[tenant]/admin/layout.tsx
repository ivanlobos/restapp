import { Sidebar } from "@/components/admin/Sidebar";
import { WaiterCalls } from "@/components/admin/WaiterCalls";
import { getTenantByAdminKey } from "@/lib/tenant";
import { notFound } from "next/navigation";

type AdminLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
  searchParams?: Promise<{ key?: string }>;
};

export default async function AdminLayout({
  children,
  params,
  searchParams,
}: AdminLayoutProps) {
  const { tenant: tenantSlug } = await params;
  const sp = (await searchParams) ?? {};
  const adminKey = sp.key;

  const tenant = await getTenantByAdminKey(tenantSlug, adminKey);

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
