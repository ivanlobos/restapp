"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const languages = [
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "pt", flag: "🇵🇹", label: "PT" },
  { code: "zh", flag: "🇨🇳", label: "ZH" },
];

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setOpen(false);
  };

  const current = languages.find((l) => l.code === currentLocale) || languages[0];

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden w-32">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors ${
                lang.code === currentLocale
                  ? "bg-amber-50 text-amber-700 font-semibold"
                  : "text-gray-700"
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
