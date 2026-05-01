"use client";

import { ImagePlus, Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { CLIENT_API_URL } from "@/lib/clientApi";

export function SellerProductForm() {
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function createProduct(formData: FormData) {
    setSaving(true);
    setMessage("");
    const token = await getToken();
    const payload = {
      title: String(formData.get("title")),
      description: String(formData.get("description")),
      category: String(formData.get("category")),
      price: Number(formData.get("price")),
      inventory: Number(formData.get("inventory")),
      imageUrls: [String(formData.get("imageUrl"))]
    };

    const response = await fetch(`${CLIENT_API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    setMessage(response.ok ? "Product created. Refresh to see it in your catalog." : "Could not create product.");
  }

  return (
    <form action={createProduct} className="rounded-lg border border-line bg-white p-5">
      <div className="mb-4 flex items-center gap-2 font-bold">
        <ImagePlus className="h-5 w-5 text-brand" />
        New Product
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input name="title" required placeholder="Product title" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        <input name="category" required placeholder="Category" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        <input name="price" required min="0.01" step="0.01" type="number" placeholder="Price" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        <input name="inventory" required min="0" type="number" placeholder="Inventory" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        <input name="imageUrl" required type="url" placeholder="Image URL" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand md:col-span-2" />
        <textarea name="description" required minLength={10} placeholder="Description" className="min-h-24 rounded-md border border-line px-3 py-2 outline-none focus:border-brand md:col-span-2" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button disabled={saving} className="focus-ring inline-flex items-center rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60">
          <Plus className="mr-2 h-4 w-4" />
          {saving ? "Creating" : "Create"}
        </button>
        {message && <span className="text-sm text-slate-600">{message}</span>}
      </div>
    </form>
  );
}
