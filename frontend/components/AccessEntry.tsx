"use client";

import { ShieldCheck, ShoppingBag, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CLIENT_API_URL } from "@/lib/clientApi";

type Role = "BUYER" | "SELLER" | "ADMIN";
type Me = { role: Role; email?: string; username?: string; name?: string };

const choices = [
  {
    role: "ADMIN",
    title: "Admin",
    description: "The first registered account becomes the only admin.",
    href: "/admin",
    icon: ShieldCheck
  },
  {
    role: "SELLER",
    title: "Seller",
    description: "Create products, manage inventory, and track revenue.",
    href: "/seller",
    icon: Store
  },
  {
    role: "BUYER",
    title: "Buyer",
    description: "Shop products, manage cart, checkout, and track orders.",
    href: "/",
    icon: ShoppingBag
  }
] as const;

export function AccessEntry({ currentUser, requestedRole }: { currentUser?: Me; requestedRole?: Role }) {
  const [selectedRole, setSelectedRole] = useState<Role>(requestedRole ?? "ADMIN");
  const [mode, setMode] = useState<"register" | "login">("register");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const selected = choices.find((choice) => choice.role === selectedRole)!;

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage("");

    const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
    const body =
      mode === "register"
        ? {
            role: selectedRole,
            username: String(formData.get("username") || ""),
            email: String(formData.get("email") || ""),
            password: String(formData.get("password") || "")
          }
        : {
            identifier: String(formData.get("identifier") || ""),
            password: String(formData.get("password") || "")
          };

    const response = await fetch(`${CLIENT_API_URL}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    setLoading(false);

    if (response.ok) {
      const data = (await response.json()) as Me;
      const destination = choices.find((choice) => choice.role === data.role)?.href ?? "/";
      router.push(destination);
      router.refresh();
      return;
    }

    const data = await response.json().catch(() => ({ message: "Could not continue." }));
    setMessage(data.message ?? "Could not continue.");
  }

  async function logout() {
    await fetch(`${CLIENT_API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/access");
    router.refresh();
  }

  if (currentUser) {
    const current = choices.find((choice) => choice.role === currentUser.role)!;

    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-lg border border-line bg-white p-6 shadow-sm">
          <current.icon className="h-7 w-7 text-brand" />
          <p className="mt-4 text-sm font-semibold text-slate-600">Signed in as</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">{currentUser.username ?? currentUser.email}</h1>
          <p className="mt-2 text-slate-600">Role: {currentUser.role}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => router.push(current.href)} className="focus-ring rounded-md bg-brand px-4 py-2 font-semibold text-white">
              Continue
            </button>
            <button onClick={logout} className="focus-ring rounded-md border border-line px-4 py-2 font-semibold hover:bg-slate-50">
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[420px_1fr]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Choose Account Type</h1>
        <p className="mt-3 text-slate-600">Register with username, email, and password. After that, log in with username or email and password.</p>

        <div className="mt-6 grid gap-3">
          {choices.map((choice) => (
            <button
              key={choice.role}
              onClick={() => setSelectedRole(choice.role)}
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

      <form action={submit} className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-600">{mode === "register" ? "Register as" : "Log in"}</p>
            <h2 className="text-2xl font-bold">{mode === "register" ? selected.title : "Existing Account"}</h2>
          </div>
          <selected.icon className="h-7 w-7 text-brand" />
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-md border border-line p-1">
          <button type="button" onClick={() => setMode("register")} className={`rounded px-3 py-2 text-sm font-semibold ${mode === "register" ? "bg-brand text-white" : "hover:bg-slate-100"}`}>
            Register
          </button>
          <button type="button" onClick={() => setMode("login")} className={`rounded px-3 py-2 text-sm font-semibold ${mode === "login" ? "bg-brand text-white" : "hover:bg-slate-100"}`}>
            Login
          </button>
        </div>

        {mode === "register" && selectedRole === "ADMIN" && (
          <p className="mb-5 rounded-md border border-line bg-slate-50 p-3 text-sm text-slate-600">
            Because the database is fresh, the first registered account becomes admin. After that, admin registration is closed.
          </p>
        )}

        <div className="grid gap-3">
          {mode === "register" ? (
            <>
              <input name="username" required minLength={3} pattern="[A-Za-z0-9_]+" placeholder="Username" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
              <input name="email" required type="email" placeholder="Email address" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
            </>
          ) : (
            <input name="identifier" required placeholder="Username or email" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
          )}
          <input name="password" required minLength={8} type="password" placeholder="Password" className="rounded-md border border-line px-3 py-2 outline-none focus:border-brand" />
        </div>

        <button disabled={loading} className="focus-ring mt-5 w-full rounded-md bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60">
          {loading ? "Working" : mode === "register" ? `Register ${selected.title}` : "Log in"}
        </button>
        {message && <p className="mt-3 text-sm font-medium text-red-600">{message}</p>}
      </form>
    </main>
  );
}
