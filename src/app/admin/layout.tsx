import { Sidebar } from "@/components/admin/Sidebar";
import { WaiterCalls } from "@/components/admin/WaiterCalls";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <WaiterCalls />
      <main className="md:ml-56 pb-20 md:pb-0">{children}</main>
    </div>
  );
}