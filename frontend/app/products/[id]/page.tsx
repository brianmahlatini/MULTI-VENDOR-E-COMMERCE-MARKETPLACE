import Image from "next/image";
import { AddToCartButton } from "@/components/AddToCartButton";
import { publicApiFetch } from "@/lib/api";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await publicApiFetch<Product>(`/products/${id}`);

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-white">
        <Image src={product.imageUrls[0]} alt={product.title} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">{product.category}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">{product.title}</h1>
          <p className="mt-4 text-3xl font-bold">${product.price.toFixed(2)}</p>
        </div>
        <p className="leading-7 text-slate-700">{product.description}</p>
        <div className="flex items-center gap-4">
          <AddToCartButton productId={product._id} />
          <span className="text-sm text-slate-600">{product.inventory} in stock</span>
        </div>
        <div className="border-t border-line pt-6">
          <h2 className="text-lg font-bold">Reviews</h2>
          <div className="mt-3 space-y-3">
            {product.reviews.length === 0 ? <p className="text-slate-600">No reviews yet.</p> : product.reviews.map((review, index) => (
              <article key={index} className="rounded-lg border border-line bg-white p-4">
                <p className="font-semibold">{review.buyerName} · {review.rating}/5</p>
                <p className="mt-1 text-slate-700">{review.comment}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
