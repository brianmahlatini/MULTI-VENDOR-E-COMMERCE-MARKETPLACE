"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { useState } from "react";

const choices = [
  {
    role: "BUYER",
    title: "Buyer",
    description: "Use a buyer account for shopping, cart, checkout, and order tracking.",
    icon: ShoppingBag
  },
  {
    role: "SELLER",
    title: "Seller",
    description: "Use a seller account for products, inventory, orders, and revenue tracking.",
    icon: Store
  },
  {
    role: "ADMIN",
    title: "Admin",
    description: "Use the one approved admin account. Only mahlatinibrian@gmail.com can enter here.",
    icon: ShieldCheck
  }
] as const;

export function AccessEntry() {
  const [selectedRole, setSelectedRole] = useState<"BUYER" | "SELLER" | "ADMIN">("BUYER");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const selected = choices.find((choice) => choice.role === selectedRole)!;
  const redirectUrl = `/access?role=${selectedRole}`;

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[420px_1fr]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Choose Account Type</h1>
        <p className="mt-3 text-slate-600">Use separate accounts for buyer, seller, and admin. New buyer or seller accounts are assigned once after sign-up.</p>

        <div className="mt-6 grid gap-3">
          {choices.map((choice) => (
            <button
              key={choice.role}
              onClick={() => {
                setSelectedRole(choice.role);
                setMode(choice.role === "ADMIN" ? "sign-in" : "sign-up");
              }}
              className={`focus-ring rounded-lg border bg-white p-5 text-left shadow-sm transition hover:border-brand ${
                selectedRole === choice.role ? "border-brand ring-2 ring-brand/20" : "border-line"
              }`}
            >
              <choice.icon className="h-6 w-6 text-brand" />
              <h2 className="mt-4 text-lg font-bold">{choice.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{choice.description}</p>
            </button>
          ))}
        </div>
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-600">Selected access</p>
            <h2 className="text-2xl font-bold">{selected.title}</h2>
          </div>
          <selected.icon className="h-7 w-7 text-brand" />
        </div>

        {selectedRole !== "ADMIN" && (
          <div className="mb-5 grid grid-cols-2 rounded-md border border-line p-1">
            <button
              onClick={() => setMode("sign-up")}
              className={`rounded px-3 py-2 text-sm font-semibold ${mode === "sign-up" ? "bg-brand text-white" : "hover:bg-slate-100"}`}
            >
              Register
            </button>
            <button
              onClick={() => setMode("sign-in")}
              className={`rounded px-3 py-2 text-sm font-semibold ${mode === "sign-in" ? "bg-brand text-white" : "hover:bg-slate-100"}`}
            >
              Login
            </button>
          </div>
        )}

        {selectedRole === "ADMIN" && (
          <p className="mb-5 rounded-md border border-line bg-slate-50 p-3 text-sm text-slate-600">
            Admin is login only. Use the approved admin account: mahlatinibrian@gmail.com.
          </p>
        )}

        <div className="overflow-hidden rounded-lg">
          {mode === "sign-in" || selectedRole === "ADMIN" ? (
            <SignIn routing="hash" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
          ) : (
            <SignUp routing="hash" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl} />
          )}
        </div>
      </section>
    </main>
  );
}
