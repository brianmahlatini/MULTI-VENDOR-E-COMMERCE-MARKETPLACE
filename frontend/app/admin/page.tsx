import { redirect } from "next/navigation";
import { Activity, Package, Users, Wallet } from "lucide-react";
import { apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

type AdminDashboard = {
  metrics: { users: number; activeProducts: number; orders: number; revenue: number };
  users: Array<{ id: string; email: string; name?: string | null; role: string; createdAt: string }>;
  products: Array<{ _id: string; title: string; category: string; inventory: number; price: number; createdAt: string }>;
  orders: Array<{ id: string; status: string; total: string | number; createdAt: string; items: Array<{ id: string; title: string; quantity: number }> }>;
  logs: Array<{ id: string; event: string; createdAt: string }>;
};

type Me = { role: "BUYER" | "SELLER" | "ADMIN"; email?: string; name?: string };

export default async function AdminPage() {
  const me = await apiRequest<Me>("/auth/me");
  if (me.data?.role !== "ADMIN") {
    redirect("/access?role=ADMIN");
  }

  const dashboard = await apiRequest<AdminDashboard>("/admin/dashboard");
  if (!dashboard.data) return <main className="mx-auto max-w-5xl px-4 py-10">Could not load admin dashboard.</main>;
  const cards = [
    { label: "Members", value: dashboard.data.metrics.users, icon: Users, href: "#members" },
    { label: "Available goods", value: dashboard.data.metrics.activeProducts, icon: Package, href: "#goods" },
    { label: "Orders", value: dashboard.data.metrics.orders, icon: Activity, href: "#orders" },
    { label: "Revenue", value: `$${dashboard.data.metrics.revenue.toFixed(2)}`, icon: Wallet, href: "#revenue" }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <a key={card.label} href={card.href} className="focus-ring rounded-lg border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <card.icon className="h-5 w-5 text-brand" />
            <p className="mt-3 text-sm text-slate-600">{card.label}</p>
            <p className="break-words text-2xl font-bold">{card.value}</p>
          </a>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section id="members" className="scroll-mt-24 rounded-lg border border-line bg-white">
          <div className="border-b border-line p-4 font-bold">Members</div>
          <div className="divide-y divide-line">
            {dashboard.data.users.map((user) => (
              <div key={user.id} className="grid gap-1 p-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name || user.email}</p>
                  <p className="truncate text-slate-600">{user.email}</p>
                </div>
                <span className="font-semibold text-brand">{user.role}</span>
              </div>
            ))}
          </div>
        </section>
        <section id="goods" className="scroll-mt-24 rounded-lg border border-line bg-white">
          <div className="border-b border-line p-4 font-bold">Available Goods</div>
          <div className="divide-y divide-line">
            {dashboard.data.products.map((product) => (
              <div key={product._id} className="grid gap-2 p-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.title}</p>
                  <p className="text-slate-600">{product.category}</p>
                </div>
                <span className="text-slate-600 sm:text-right">{product.inventory} in stock</span>
                <span className="font-bold sm:text-right">${product.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section id="orders" className="mt-8 scroll-mt-24 rounded-lg border border-line bg-white">
        <div className="border-b border-line p-4 font-bold">Orders</div>
        <div className="divide-y divide-line">
          {dashboard.data.orders.map((order) => (
            <div key={order.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-medium">{order.items.map((item) => `${item.title} x${item.quantity}`).join(", ") || "Order items"}</p>
                <p className="text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className="font-semibold text-brand">{order.status}</span>
              <span className="font-bold sm:text-right">${Number(order.total).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>
      <section id="revenue" className="mt-8 scroll-mt-24 rounded-lg border border-line bg-white">
        <div className="border-b border-line p-4 font-bold">Revenue</div>
        <div className="grid gap-3 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-slate-600">Total revenue</p>
            <p className="text-xl font-bold">${dashboard.data.metrics.revenue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-600">Tracked orders</p>
            <p className="text-xl font-bold">{dashboard.data.metrics.orders}</p>
          </div>
          <div>
            <p className="text-slate-600">Average order</p>
            <p className="text-xl font-bold">${(dashboard.data.metrics.revenue / Math.max(dashboard.data.metrics.orders, 1)).toFixed(2)}</p>
          </div>
        </div>
      </section>
      <section className="mt-8 rounded-lg border border-line bg-white">
        <div className="border-b border-line p-4 font-bold">Order Tracking History</div>
        <div className="divide-y divide-line">
          {dashboard.data.logs.map((log) => (
            <div key={log.id} className="grid gap-1 p-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <span className="min-w-0 font-medium">{log.event}</span>
              <span className="text-slate-600 sm:text-right">{new Date(log.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
