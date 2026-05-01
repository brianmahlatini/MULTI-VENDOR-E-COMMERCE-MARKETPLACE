import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BarChart3, Boxes, DollarSign, PackageCheck } from "lucide-react";
import { SellerProductForm } from "@/components/SellerProductForm";
import { apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

type SellerDashboard = {
  metrics: { products: number; orders: number; unitsSold: number; revenue: number };
  products: Array<{ _id: string; title: string; inventory: number; price: number }>;
};

type Me = { role: "BUYER" | "SELLER" | "ADMIN"; email?: string; name?: string };

export default async function SellerPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/access?role=SELLER");
  }

  const me = await apiRequest<Me>("/auth/me");
  if (!me.data || !["SELLER", "ADMIN"].includes(me.data.role)) {
    redirect("/access?role=SELLER");
  }

  const dashboard = await apiRequest<SellerDashboard>("/seller/dashboard");
  if (!dashboard.data) {
    return <main className="mx-auto max-w-5xl px-4 py-10">Could not load seller dashboard.</main>;
  }
  const cards = [
    { label: "Revenue", value: `$${dashboard.data.metrics.revenue.toFixed(2)}`, icon: DollarSign },
    { label: "Orders", value: dashboard.data.metrics.orders, icon: PackageCheck },
    { label: "Products", value: dashboard.data.metrics.products, icon: Boxes },
    { label: "Units sold", value: dashboard.data.metrics.unitsSold, icon: BarChart3 }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Seller Dashboard</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {cards.map((card) => <article key={card.label} className="rounded-lg border border-line bg-white p-5"><card.icon className="h-5 w-5 text-brand" /><p className="mt-3 text-sm text-slate-600">{card.label}</p><p className="text-2xl font-bold">{card.value}</p></article>)}
      </div>
      <div className="mt-8">
        <SellerProductForm />
      </div>
      <section className="mt-8 rounded-lg border border-line bg-white">
        <div className="border-b border-line p-4 font-bold">Products</div>
        <div className="divide-y divide-line">
          {dashboard.data.products.map((product) => (
            <div key={product._id} className="grid grid-cols-3 p-4 text-sm">
              <span className="font-medium">{product.title}</span>
              <span>{product.inventory} in stock</span>
              <span className="text-right font-bold">${product.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
