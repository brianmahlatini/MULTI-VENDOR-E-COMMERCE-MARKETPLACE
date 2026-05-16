"use client";

import { Edit3, ExternalLink, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CLIENT_API_URL } from "@/lib/clientApi";

type SellerProduct = {
  _id: string;
  title: string;
  description: string;
  category: string;
  inventory: number;
  price: number;
};

export function SellerProductsManager({ products }: { products: SellerProduct[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function updateProduct(productId: string, formData: FormData) {
    setBusyId(productId);
    setMessage("");

    const response = await fetch(`${CLIENT_API_URL}/products/${productId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(formData.get("title")),
        description: String(formData.get("description")),
        category: String(formData.get("category")),
        price: Number(formData.get("price")),
        inventory: Number(formData.get("inventory"))
      })
    });

    setBusyId(null);
    if (response.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      setMessage("Could not update product.");
    }
  }

  async function deleteProduct(productId: string) {
    const confirmed = window.confirm("Delete this product from your catalog?");
    if (!confirmed) return;

    setBusyId(productId);
    setMessage("");
    const response = await fetch(`${CLIENT_API_URL}/products/${productId}`, {
      method: "DELETE",
      credentials: "include"
    });

    setBusyId(null);
    if (response.ok) {
      router.refresh();
    } else {
      setMessage("Could not delete product.");
    }
  }

  return (
    <section id="products" className="mt-8 scroll-mt-24 rounded-lg border border-line bg-white">
      <div className="border-b border-line p-4 font-bold">Products</div>
      <div className="divide-y divide-line">
        {products.length === 0 ? (
          <p className="p-4 text-sm text-slate-600">No products yet.</p>
        ) : (
          products.map((product) =>
            editingId === product._id ? (
              <form key={product._id} action={(formData) => updateProduct(product._id, formData)} className="grid gap-3 p-4 text-sm md:grid-cols-2">
                <input name="title" required defaultValue={product.title} className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
                <input name="category" required defaultValue={product.category} className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
                <input name="price" required min="0.01" step="0.01" type="number" defaultValue={product.price} className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
                <input name="inventory" required min="0" type="number" defaultValue={product.inventory} className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
                <textarea name="description" required minLength={10} defaultValue={product.description} className="min-h-24 rounded-md border border-line px-3 py-2 outline-none focus:border-brand md:col-span-2" />
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <button disabled={busyId === product._id} className="focus-ring inline-flex items-center rounded-md bg-brand px-3 py-2 font-semibold text-white disabled:opacity-60">
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="inline-flex items-center rounded-md border border-line px-3 py-2 font-semibold hover:bg-slate-50">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div key={product._id} className="grid gap-3 p-4 text-sm lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
                <div className="min-w-0">
                  <Link href={`/products/${product._id}`} className="truncate font-medium text-ink hover:text-brand">
                    {product.title}
                  </Link>
                  <p className="text-slate-600">{product.category}</p>
                </div>
                <span className="text-slate-600 lg:text-right">{product.inventory} in stock</span>
                <span className="font-bold lg:text-right">${product.price.toFixed(2)}</span>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Link href={`/products/${product._id}`} className="inline-flex items-center rounded-md border border-line px-3 py-2 font-semibold hover:bg-slate-50">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Link>
                  <button onClick={() => setEditingId(product._id)} className="inline-flex items-center rounded-md border border-line px-3 py-2 font-semibold hover:bg-slate-50">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </button>
                  <button disabled={busyId === product._id} onClick={() => deleteProduct(product._id)} className="inline-flex items-center rounded-md border border-red-200 px-3 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
      {message && <p className="border-t border-line p-4 text-sm font-medium text-red-600">{message}</p>}
    </section>
  );
}
