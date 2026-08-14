import { apiFetch } from "@/lib/api/client";
import type { User } from "@/lib/types";

export function login(email: string, password: string): Promise<User> {
  return apiFetch<User>("/auth/login", { method: "POST", body: { email, password } });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export function me(): Promise<User> {
  return apiFetch<User>("/auth/me");
}
