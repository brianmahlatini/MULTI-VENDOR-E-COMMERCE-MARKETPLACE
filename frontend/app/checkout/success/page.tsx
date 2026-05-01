import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Payment confirmed</h1>
      <p className="mt-3 text-slate-600">Your order is being processed. Tracking updates will appear in your order history.</p>
      <Link href="/" className="mt-6 inline-flex rounded-md bg-brand px-5 py-3 font-semibold text-white">Continue shopping</Link>
    </main>
  );
}
