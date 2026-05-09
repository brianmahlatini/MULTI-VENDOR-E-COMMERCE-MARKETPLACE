import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckoutButton } from "@/components/CheckoutButton";
import { apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

type Cart = {
  items: Array<{ id: string; title: string; imageUrl?: string; price: string; quantity: number }>;
};

export default async function CartPage() {
  const cartResponse = await apiRequest<Cart>("/cart");
  if (cartResponse.status === 401 || cartResponse.status === 403) redirect("/access?role=BUYER");
  if (!cartResponse.data) return <main className="mx-auto max-w-5xl px-4 py-10">Could not load your cart.</main>;

  const cart = cartResponse.data;
  const total = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Cart</h1>
        {cart.items.length === 0 && <p className="rounded-lg border border-line bg-white p-4 text-slate-600">Your cart is empty.</p>}
        {cart.items.map((item) => (
          <article key={item.id} className="flex gap-4 rounded-lg border border-line bg-white p-4">
            {item.imageUrl && <Image src={item.imageUrl} alt={item.title} width={96} height={96} className="h-24 w-24 rounded-md object-cover" />}
            <div className="flex-1">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="text-sm text-slate-600">Qty {item.quantity}</p>
            </div>
            <p className="font-bold">${(Number(item.price) * item.quantity).toFixed(2)}</p>
          </article>
        ))}
      </section>
      <aside className="h-fit rounded-lg border border-line bg-white p-5">
        <div className="mb-4 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <CheckoutButton />
      </aside>
    </main>
  );
}
