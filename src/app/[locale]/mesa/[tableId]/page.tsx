import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NameEntry } from "./NameEntry";
import { getTranslations } from "next-intl/server";

export default async function TablePage({ params }: { params: Promise<{ tableId: string; locale: string }> }) {
  const { tableId, locale } = await params;
  const t = await getTranslations({ locale, namespace: "TablePage" });
  const tName = await getTranslations({ locale, namespace: "NameEntry" });

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table || !table.isActive) notFound();

  const texts = {
    title: tName("title"),
    placeholder: tName("placeholder"),
    hint: tName("hint", { tableNumber: table.number }),
    emailTitle: tName("emailTitle"),
    emailHint: tName("emailHint"),
    emailPlaceholder: tName("emailPlaceholder"),
    submit: tName("submit"),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🍽</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t("welcome")}</h1>
          <p className="text-gray-500 mt-1">
            {t("table")} {table.number}{table.label ? ` · ${table.label}` : ""}
          </p>
        </div>

        <NameEntry tableId={tableId} tableNumber={table.number} locale={locale} texts={texts} />
      </div>
    </div>
  );
}
