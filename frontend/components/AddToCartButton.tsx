"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_API_URL } from "@/lib/clientApi";

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function addToCart() {
    setLoading(true);
    setError("");
    setDone(false);

    try {
      const response = await fetch(`${CLIENT_API_URL}/cart/items`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (response.ok) {
        setDone(true);
        router.refresh();
        return;
      }

      if (response.status === 401 || response.status === 403) {
        router.push("/access?role=BUYER");
        return;
      }

      const data = await response.json().catch(() => ({ message: "Could not add this item to your cart." }));
      setError(data.message ?? "Could not add this item to your cart.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={addToCart} disabled={loading} className="focus-ring inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 font-semibold text-white disabled:opacity-60">
        <ShoppingCart className="mr-2 h-4 w-4" />
        {done ? "Added" : loading ? "Adding" : "Add to cart"}
      </button>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
