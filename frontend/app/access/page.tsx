import { AccessEntry } from "@/components/AccessEntry";
import { apiRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

type Me = { role: "BUYER" | "SELLER" | "ADMIN"; assignedRole?: "BUYER" | "SELLER" | "ADMIN"; email?: string; name?: string };

function parseRequestedRole(value?: string): "BUYER" | "SELLER" | "ADMIN" | undefined {
  return value === "BUYER" || value === "SELLER" || value === "ADMIN" ? value : undefined;
}

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const params = await searchParams;
  const requestedRole = parseRequestedRole(params.role);
  const me = await apiRequest<Me>("/auth/me");

  return <AccessEntry currentUser={me.data} requestedRole={requestedRole} />;
}
