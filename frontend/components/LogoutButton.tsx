"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { CLIENT_API_URL } from "@/lib/clientApi";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch(`${CLIENT_API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/access");
    router.refresh();
  }

  return (
    <button onClick={logout} className="focus-ring rounded-md border border-line px-3 py-2 hover:bg-slate-100" title="Sign out">
      <LogOut className="h-4 w-4" />
    </button>
  );
}
