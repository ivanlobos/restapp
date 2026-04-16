import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NameEntry } from "./NameEntry";

export default async function TablePage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isActive) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
          <p className="text-gray-500 mt-1">
            Mesa {table.number}{table.label ? ` · ${table.label}` : ""}
          </p>
        </div>

        <NameEntry tableId={tableId} tableNumber={table.number} />
      </div>
    </div>
  );
}
