"use client";

import { ImagePlus, Plus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CLIENT_API_URL } from "@/lib/clientApi";

type UploadResponse = {
  publicUrl: string;
};

export function SellerProductForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function createProduct(formData: FormData) {
    setSaving(true);
    setMessage("");
    const imageFile = formData.get("image");

    if (!(imageFile instanceof File) || imageFile.size === 0) {
      setSaving(false);
      setMessage("Choose a product image.");
      return;
    }

    const uploadResponse = await fetch(`${CLIENT_API_URL}/products/uploads?fileName=${encodeURIComponent(imageFile.name)}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": imageFile.type
      },
      body: imageFile
    });

    if (!uploadResponse.ok) {
      setSaving(false);
      setMessage("Could not upload image.");
      return;
    }

    const uploaded = (await uploadResponse.json()) as UploadResponse;
    const payload = {
      title: String(formData.get("title")),
      description: String(formData.get("description")),
      category: String(formData.get("category")),
      price: Number(formData.get("price")),
      inventory: Number(formData.get("inventory")),
      imageUrls: [uploaded.publicUrl]
    };

    const response = await fetch(`${CLIENT_API_URL}/products`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    if (response.ok) {
      formRef.current?.reset();
      setPreviewUrl("");
      setMessage("Product created.");
      router.refresh();
    } else {
      setMessage("Could not create product.");
    }
  }

  return (
    <form ref={formRef} action={createProduct} className="rounded-lg border border-line bg-white p-5">
      <div className="mb-4 flex items-center gap-2 font-bold">
        <ImagePlus className="h-5 w-5 text-brand" />
        New Product
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <input name="title" required placeholder="Product title" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        <input name="category" required placeholder="Category" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        <input name="price" required min="0.01" step="0.01" type="number" placeholder="Price" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        <input name="inventory" required min="0" type="number" placeholder="Inventory" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line bg-slate-50 px-4 py-5 text-center text-sm text-slate-600 transition hover:border-brand hover:bg-white md:col-span-2">
          {previewUrl ? (
            <img src={previewUrl} alt="Selected product preview" className="h-32 w-full rounded-md object-cover" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-brand" />
              <span className="font-medium text-ink">Upload product image</span>
              <span>PNG, JPG, WEBP, or GIF up to 5MB</span>
            </>
          )}
          <input
            name="image"
            required
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreviewUrl(file ? URL.createObjectURL(file) : "");
            }}
          />
        </label>
        <textarea name="description" required minLength={10} placeholder="Description" className="min-h-24 rounded-md border border-line px-3 py-2 outline-none focus:border-brand md:col-span-2" />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button disabled={saving} className="focus-ring inline-flex items-center rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60">
          <Plus className="mr-2 h-4 w-4" />
          {saving ? "Creating" : "Create"}
        </button>
        {message && <span className="text-sm text-slate-600">{message}</span>}
      </div>
    </form>
  );
}
