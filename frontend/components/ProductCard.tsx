import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const rating =
    product.reviews.length === 0
      ? "New"
      : `${(product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)} stars`;

  return (
    <Link href={`/products/${product._id}`} className="group rounded-lg border border-line bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
        <Image src={product.imageUrls[0]} alt={product.title} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
      </div>
      <div className="mt-3 space-y-1">
        <p className="line-clamp-2 min-h-10 text-sm font-semibold text-ink">{product.title}</p>
        <p className="text-sm text-slate-600">{product.category}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold">${product.price.toFixed(2)}</span>
          <span className="text-xs text-slate-500">{rating}</span>
        </div>
      </div>
    </Link>
  );
}
