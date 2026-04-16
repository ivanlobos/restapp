"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, Tag } from "lucide-react";
import { formatCLP } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  categoryId: string;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  products: Product[];
}

export function CartaClient({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(initialCategories[0]?.id ?? null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [productModal, setProductModal] = useState<{ mode: "create" | "edit"; product?: Product } | null>(null);
  const [loading, setLoading] = useState(false);

  // Product form state
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pImage, setPImage] = useState("");
  const [pCat, setPCat] = useState("");

  const openCreate = () => {
    setPName(""); setPDesc(""); setPPrice(""); setPImage(""); setPCat(selectedCatId ?? "");
    setProductModal({ mode: "create" });
  };

  const openEdit = (product: Product) => {
    setPName(product.name); setPDesc(product.description ?? "");
    setPPrice(product.price.toString()); setPImage(product.imageUrl ?? ""); setPCat(product.categoryId);
    setProductModal({ mode: "edit", product });
  };

  const closeModal = () => setProductModal(null);

  const handleCatCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catName, sortOrder: categories.length }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, { ...cat, products: [] }]);
      setSelectedCatId(cat.id);
      setCatName("");
      setShowCatForm(false);
    }
    setLoading(false);
  };

  const handleCatDelete = async (id: string) => {
    if (!confirm("¿Eliminar categoría y todos sus productos?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      const newCats = categories.filter((c) => c.id !== id);
      setCategories(newCats);
      if (selectedCatId === id) setSelectedCatId(newCats[0]?.id ?? null);
    }
  };

  const handleProductSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = { name: pName, description: pDesc, price: parseInt(pPrice), categoryId: pCat, imageUrl: pImage || null };
    let res: Response;

    if (productModal?.mode === "create") {
      res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      res = await fetch(`/api/products/${productModal!.product!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }

    if (res.ok) {
      const saved = await res.json();
      setCategories((prev) =>
        prev.map((cat) => {
          if (productModal?.mode === "create" && cat.id === saved.categoryId) {
            return { ...cat, products: [...cat.products, saved] };
          }
          if (productModal?.mode === "edit") {
            return {
              ...cat,
              products: cat.products
                .filter((p) => !(p.id === saved.id && cat.id !== saved.categoryId))
                .map((p) => (p.id === saved.id ? saved : p))
                .concat(cat.id === saved.categoryId && !cat.products.find((p) => p.id === saved.id) ? [saved] : []),
            };
          }
          return cat;
        })
      );
      closeModal();
    }
    setLoading(false);
  };

  const handleToggleAvailability = async (product: Product) => {
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !product.isAvailable }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          products: cat.products.map((p) => (p.id === updated.id ? updated : p)),
        }))
      );
    }
  };

  const handleProductDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((cat) => ({ ...cat, products: cat.products.filter((p) => p.id !== product.id) }))
      );
    }
  };

  const selectedCat = categories.find((c) => c.id === selectedCatId);

  return (
    <div className="p-6 flex gap-6 min-h-screen">
      {/* Categories sidebar */}
      <div className="w-52 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Categorías</h2>
          <button onClick={() => setShowCatForm(!showCatForm)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
            <Plus size={16} />
          </button>
        </div>

        {showCatForm && (
          <form onSubmit={handleCatCreate} className="mb-3 flex gap-1">
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Nombre"
              required
              autoFocus
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-0"
            />
            <button type="submit" disabled={loading} className="bg-amber-500 text-white px-2 py-1.5 rounded-lg text-sm">
              +
            </button>
          </form>
        )}

        <div className="space-y-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm transition-colors ${
                selectedCatId === cat.id ? "bg-amber-500 text-white" : "hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => setSelectedCatId(cat.id)}
            >
              <span className="flex items-center gap-1.5 truncate">
                <Tag size={13} />
                <span className="truncate">{cat.name}</span>
                <span className={`text-xs ml-1 ${selectedCatId === cat.id ? "text-amber-100" : "text-gray-400"}`}>
                  ({cat.products.length})
                </span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleCatDelete(cat.id); }}
                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
                  selectedCatId === cat.id ? "text-amber-100 hover:text-white" : "text-red-400"
                }`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Products panel */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {selectedCat ? selectedCat.name : "Carta"}
          </h1>
          {selectedCat && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <Plus size={16} />
              Agregar producto
            </button>
          )}
        </div>

        {!selectedCat ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p>Selecciona o crea una categoría para ver sus productos.</p>
          </div>
        ) : selectedCat.products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p>No hay productos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {selectedCat.products.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-opacity ${
                  product.isAvailable ? "border-gray-100" : "border-gray-200 opacity-60"
                }`}
              >
                {product.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>
                    )}
                    <p className="font-bold text-amber-600 mt-2">{formatCLP(product.price)}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleToggleAvailability(product)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {product.isAvailable ? <><Eye size={13} /> Disponible</> : <><EyeOff size={13} /> No disponible</>}
                  </button>
                  <button
                    onClick={() => openEdit(product)}
                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleProductDelete(product)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product modal */}
      {productModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">
                {productModal.mode === "create" ? "Nuevo producto" : "Editar producto"}
              </h3>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleProductSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                <input
                  value={pName} onChange={(e) => setPName(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                <textarea
                  value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio (CLP) *</label>
                  <input
                    type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} required min={1}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Categoría *</label>
                  <select
                    value={pCat} onChange={(e) => setPCat(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">Seleccionar</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">URL de imagen</label>
                <input
                  type="url" value={pImage} onChange={(e) => setPImage(e.target.value)} placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
