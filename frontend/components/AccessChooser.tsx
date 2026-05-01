"use client";

import { ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CLIENT_API_URL } from "@/lib/clientApi";

const choices = [
  {
    role: "BUYER",
    title: "Continue as Buyer",
    description: "Shop products, manage cart, checkout, and track orders.",
    href: "/",
    icon: ShoppingBag
  },
  {
    role: "SELLER",
    title: "Continue as Seller",
    description: "Create products, manage inventory, view sales, and track revenue.",
    href: "/seller",
    icon: Store
  },
  {
    role: "ADMIN",
    title: "Continue as Admin",
    description: "Use the one approved admin account to manage users, orders, and platform activity.",
    href: "/admin",
    icon: ShieldCheck
  }
] as const;

export function AccessChooser({
  currentRole,
  assignedRole,
  requestedRole
}: {
  currentRole?: "BUYER" | "SELLER" | "ADMIN";
  assignedRole?: "BUYER" | "SELLER" | "ADMIN";
  requestedRole?: "BUYER" | "SELLER" | "ADMIN";
}) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const appliedRequestedRole = useRef(false);

  async function assignRole(role: "BUYER" | "SELLER" | "ADMIN", href: string) {
    setLoading(role);
    const token = await getToken();
    const response = await fetch(`${CLIENT_API_URL}/auth/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ role })
    });
    setLoading(null);

    if (response.ok) {
      router.push(href);
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => ({ message: "Could not update role" }));
    setMessage(data.message);
  }

  async function choose(role: "BUYER" | "SELLER" | "ADMIN", href: string) {
    setMessage("");

    if (assignedRole === role || currentRole === role) {
      router.push(href);
      router.refresh();
      return;
    }

    if (!assignedRole) {
      await assignRole(role, href);
      return;
    }

    await signOut({ redirectUrl: `/access?role=${role}` });
  }

  useEffect(() => {
    if (!requestedRole || appliedRequestedRole.current) return;
    appliedRequestedRole.current = true;
    const selected = choices.find((choice) => choice.role === requestedRole);
    if (selected) {
      void choose(selected.role, selected.href);
    }
  }, [currentRole, requestedRole, router]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-slate-600">Current Role</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{currentRole ?? "BUYER"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {assignedRole ? `This account is locked as ${assignedRole}. Sign out to use a different role account.` : "New account - select your role to get started"}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {choices.map((choice) => {
          const isCurrentRole = currentRole === choice.role;
          const needsDifferentAccount = Boolean(assignedRole && assignedRole !== choice.role && !isCurrentRole);
          
          return (
            <button
              key={choice.role}
              onClick={() => choose(choice.role, choice.href)}
              disabled={loading !== null}
              className="focus-ring rounded-lg border border-line bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <choice.icon className="h-6 w-6 text-brand" />
              <h2 className="mt-4 text-lg font-bold">
                {loading === choice.role 
                  ? "Saving..." 
                  : isCurrentRole
                  ? choice.title
                  : needsDifferentAccount
                  ? `Sign out for ${choice.role}`
                  : choice.title
                }
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{choice.description}</p>
            </button>
          );
        })}
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
    </section>
  );
}
