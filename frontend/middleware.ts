import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/cart(.*)",
  "/checkout(.*)",
  "/seller(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect({ unauthenticatedUrl: new URL("/access", req.url).toString() });
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"]
};
