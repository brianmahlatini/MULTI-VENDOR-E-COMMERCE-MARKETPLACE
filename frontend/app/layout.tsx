import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { KeyRound, ShoppingCart, Store, ShieldCheck } from "lucide-react";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "MarketHub",
  description: "Multi-vendor e-commerce marketplace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-xl font-bold tracking-tight text-ink">MarketHub</Link>
              <nav className="flex items-center gap-2 text-sm font-medium">
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/access"><KeyRound className="mr-2 inline h-4 w-4" />Access</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/seller"><Store className="mr-2 inline h-4 w-4" />Seller</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/admin"><ShieldCheck className="mr-2 inline h-4 w-4" />Admin</Link>
                <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/cart"><ShoppingCart className="mr-2 inline h-4 w-4" />Cart</Link>
                <SignedOut><Link className="focus-ring rounded-md bg-brand px-4 py-2 text-white" href="/access">Sign in</Link></SignedOut>
                <SignedIn><UserButton /></SignedIn>
              </nav>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
