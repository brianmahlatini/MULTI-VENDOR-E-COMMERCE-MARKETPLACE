import { auth } from "@clerk/nextjs/server";
import { AccessEntry } from "@/components/AccessEntry";
import { AccessChooser } from "@/components/AccessChooser";
import { apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

type Me = { role: "BUYER" | "SELLER" | "ADMIN"; assignedRole?: "BUYER" | "SELLER" | "ADMIN"; email?: string; name?: string };

function parseRequestedRole(value?: string): "BUYER" | "SELLER" | "ADMIN" | undefined {
  return value === "BUYER" || value === "SELLER" || value === "ADMIN" ? value : undefined;
}

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { userId } = await auth();
  const params = await searchParams;
  const requestedRole = parseRequestedRole(params.role);

  if (!userId) {
    return <AccessEntry />;
  }

  const me = await apiRequest<Me>("/auth/me");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <AccessChooser currentRole={me.data?.role} assignedRole={me.data?.assignedRole} requestedRole={requestedRole} />
    </main>
  );
}
