import { Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { publicApiFetch } from "@/lib/api";
import type { ProductPage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  const products = await publicApiFetch<ProductPage>(`/products?${query.toString()}`);

  return (
    <main>
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1fr_360px] md:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">MarketHub</h1>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">A full multi-seller marketplace with live catalog search, seller subscriptions, payments, reviews, and operations dashboards.</p>
          </div>
          <form className="flex rounded-lg border border-line bg-slate-50 p-2 shadow-sm">
            <Search className="ml-2 mt-2 h-5 w-5 text-slate-500" />
            <input name="q" placeholder="Search products" defaultValue={params.q} className="min-w-0 flex-1 bg-transparent px-3 outline-none" />
            <button className="focus-ring rounded-md bg-ink px-4 py-2 text-white">Search</button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {["Electronics", "Fashion", "Home", "Beauty", "Sports"].map((category) => (
            <a key={category} href={`/?category=${category}`} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-brand">{category}</a>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.items.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>
    </main>
  );
}
