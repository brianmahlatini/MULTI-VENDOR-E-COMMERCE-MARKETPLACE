import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/cart", "/checkout", "/seller"];

export function middleware(req: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) => req.nextUrl.pathname.startsWith(prefix));
  if (!isProtected || req.cookies.has("marketplace_session")) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/access";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"]
};
