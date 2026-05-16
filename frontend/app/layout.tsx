import { MessageCircle, ShieldCheck, ShoppingCart, Store } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { apiRequest } from "@/lib/api";
import "./globals.css";

export const metadata = {
  title: "MarketHub",
  description: "Multi-vendor e-commerce marketplace"
};

type Me = { role: "BUYER" | "SELLER" | "ADMIN"; email?: string };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await apiRequest<Me>("/auth/me");

  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold tracking-tight text-ink">MarketHub</Link>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/seller"><Store className="mr-2 inline h-4 w-4" />Seller</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin"><ShieldCheck className="mr-2 inline h-4 w-4" />Admin</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/chat"><MessageCircle className="mr-2 inline h-4 w-4" />Chat</Link>
              <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/cart"><ShoppingCart className="mr-2 inline h-4 w-4" />Cart</Link>
              {me.data ? (
                <>
                  <span className="hidden rounded-md bg-slate-100 px-3 py-2 text-slate-700 md:inline">{me.data.role}</span>
                  <LogoutButton />
                </>
              ) : (
                <Link className="focus-ring rounded-md bg-brand px-4 py-2 text-white" href="/access">Sign in</Link>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
