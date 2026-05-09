import { headers } from "next/headers";

const API_URL = process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookieHeader = (await headers()).get("cookie");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...init.headers
    },
    cache: init.cache ?? "no-store"
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<T>;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<{ data?: T; status: number; error?: string }> {
  const cookieHeader = (await headers()).get("cookie");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...init.headers
    },
    cache: init.cache ?? "no-store"
  });

  if (!response.ok) {
    return { status: response.status, error: await response.text() };
  }

  return { status: response.status, data: (await response.json()) as T };
}

export async function publicApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    },
    next: { revalidate: 60 }
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}
