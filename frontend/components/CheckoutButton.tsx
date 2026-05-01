"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CLIENT_API_URL } from "@/lib/clientApi";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();

  async function checkout() {
    if (!isSignedIn) {
      router.push("/access?role=BUYER");
      return;
    }

    setLoading(true);
    const token = await getToken();
    const response = await fetch(`${CLIENT_API_URL}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await response.json();
    setLoading(false);
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
  }

  return (
    <button onClick={checkout} disabled={loading} className="focus-ring inline-flex h-11 w-full items-center justify-center rounded-md bg-brand px-5 font-semibold text-white disabled:opacity-60">
      <CreditCard className="mr-2 h-4 w-4" />
      {loading ? "Opening checkout" : "Checkout"}
    </button>
  );
}
