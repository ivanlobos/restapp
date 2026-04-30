"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/customer/ProductCard";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { WaiterButton } from "@/components/customer/WaiterButton";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface Table {
  id: string;
  number: number;
  label?: string | null;
}

interface MenuClientProps {
  categories: Category[];
  tableId: string;
  table: Table;
}

export function MenuClient({ categories, tableId, table }: MenuClientProps) {
  const router = useRouter();
  const { customerName, tableId: storeTableId, setSession } = useCartStore();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  // Guard: if no name in store, redirect to entry
  useEffect(() => {
    if (!customerName || storeTableId !== tableId) {
      router.replace(`/mesa/${tableId}`);
    }
  }, [customerName, storeTableId, tableId, router]);

  // Intersection observer to update active tab
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  const scrollToCategory = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 110; // tabs + header height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  if (!customerName) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-amber-500 text-white px-4 pt-10 pb-4">
        <p className="text-amber-100 text-sm">Hola, {customerName} 👋</p>
        <h1 className="text-xl font-bold">
          Mesa {table.number}{table.label ? ` · ${table.label}` : ""}
        </h1>
      </div>

      {/* Category tabs - sticky */}
      <div
        ref={tabsRef}
        className="sticky top-0 z-30 bg-white border-b border-gray-200 overflow-x-auto flex gap-1 px-3 py-2 scrollbar-hide shadow-sm"
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => scrollToCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
              activeCategory === cat.id
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu sections */}
      <div className="px-4 py-4 space-y-8">
        {categories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            ref={(el) => { sectionRefs.current[category.id] = el; }}
          >
            <h2 className="text-lg font-bold text-gray-800 mb-3">{category.name}</h2>
            {category.products.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No hay productos disponibles</p>
            ) : (
              <div className="space-y-3">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p>La carta está siendo preparada.</p>
          </div>
        )}
      </div>

      <CartDrawer tableId={tableId} />
       <WaiterButton tableId={tableId} /> 
    </div>
  );
}
