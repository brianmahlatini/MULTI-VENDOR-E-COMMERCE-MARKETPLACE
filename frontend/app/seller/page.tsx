import { redirect } from "next/navigation";
import { BarChart3, Boxes, DollarSign, PackageCheck } from "lucide-react";
import { SellerProductForm } from "@/components/SellerProductForm";
import { SellerProductsManager } from "@/components/SellerProductsManager";
import { apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

type SellerDashboard = {
  metrics: { products: number; orders: number; unitsSold: number; revenue: number };
  products: Array<{ _id: string; title: string; description: string; category: string; inventory: number; price: number }>;
};

type Me = { role: "BUYER" | "SELLER" | "ADMIN"; email?: string; name?: string };

export default async function SellerPage() {
  const me = await apiRequest<Me>("/auth/me");
  if (me.data?.role !== "SELLER") {
    redirect("/access?role=SELLER");
  }

  const dashboard = await apiRequest<SellerDashboard>("/seller/dashboard");
  if (!dashboard.data) {
    return <main className="mx-auto max-w-5xl px-4 py-10">Could not load seller dashboard.</main>;
  }
  const cards = [
    { label: "Revenue", value: `$${dashboard.data.metrics.revenue.toFixed(2)}`, icon: DollarSign, href: "#products" },
    { label: "Orders", value: dashboard.data.metrics.orders, icon: PackageCheck, href: "#products" },
    { label: "Products", value: dashboard.data.metrics.products, icon: Boxes, href: "#products" },
    { label: "Units sold", value: dashboard.data.metrics.unitsSold, icon: BarChart3, href: "#products" }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">Seller Dashboard</h1>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <a key={card.label} href={card.href} className="focus-ring rounded-lg border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <card.icon className="h-5 w-5 text-brand" />
            <p className="mt-3 text-sm text-slate-600">{card.label}</p>
            <p className="break-words text-2xl font-bold">{card.value}</p>
          </a>
        ))}
      </div>
      <div className="mt-8">
        <SellerProductForm />
      </div>
      <SellerProductsManager products={dashboard.data.products} />
    </main>
  );
}
