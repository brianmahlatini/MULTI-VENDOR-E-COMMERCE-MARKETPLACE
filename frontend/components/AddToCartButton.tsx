"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CLIENT_API_URL } from "@/lib/clientApi";

export function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();

  async function addToCart() {
    if (!isSignedIn) {
      router.push("/access?role=BUYER");
      return;
    }

    setLoading(true);
    const token = await getToken();
    const response = await fetch(`${CLIENT_API_URL}/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    setLoading(false);
    if (response.ok) setDone(true);
  }

  return (
    <button onClick={addToCart} disabled={loading} className="focus-ring inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 font-semibold text-white disabled:opacity-60">
      <ShoppingCart className="mr-2 h-4 w-4" />
      {done ? "Added" : loading ? "Adding" : "Add to cart"}
    </button>
  );
}
