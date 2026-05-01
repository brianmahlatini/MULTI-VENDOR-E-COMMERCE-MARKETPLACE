import { auth } from "@clerk/nextjs/server";
import { Activity, Package, Users, Wallet } from "lucide-react";
import { AccessChooser } from "@/components/AccessChooser";
import { apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

type AdminDashboard = {
  metrics: { users: number; activeProducts: number; orders: number; revenue: number };
  logs: Array<{ id: string; event: string; createdAt: string }>;
};

type Me = { role: "BUYER" | "SELLER" | "ADMIN"; email?: string; name?: string };

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) return <main className="mx-auto max-w-5xl px-4 py-10">Sign in as admin.</main>;

  const me = await apiRequest<Me>("/auth/me");
  if (me.data?.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-5 text-2xl font-bold">Admin Access</h1>
        <AccessChooser currentRole={me.data?.role} />
      </main>
    );
  }

  const dashboard = await apiRequest<AdminDashboard>("/admin/dashboard");
  if (!dashboard.data) return <main className="mx-auto max-w-5xl px-4 py-10">Could not load admin dashboard.</main>;
  const cards = [
    { label: "Users", value: dashboard.data.metrics.users, icon: Users },
    { label: "Products", value: dashboard.data.metrics.activeProducts, icon: Package },
    { label: "Orders", value: dashboard.data.metrics.orders, icon: Activity },
    { label: "Revenue", value: `$${dashboard.data.metrics.revenue.toFixed(2)}`, icon: Wallet }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {cards.map((card) => <article key={card.label} className="rounded-lg border border-line bg-white p-5"><card.icon className="h-5 w-5 text-brand" /><p className="mt-3 text-sm text-slate-600">{card.label}</p><p className="text-2xl font-bold">{card.value}</p></article>)}
      </div>
      <section className="mt-8 rounded-lg border border-line bg-white">
        <div className="border-b border-line p-4 font-bold">Order Tracking History</div>
        <div className="divide-y divide-line">
          {dashboard.data.logs.map((log) => (
            <div key={log.id} className="flex justify-between p-4 text-sm">
              <span className="font-medium">{log.event}</span>
              <span className="text-slate-600">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
