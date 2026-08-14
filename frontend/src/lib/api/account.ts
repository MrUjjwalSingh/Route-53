import { apiFetch } from "@/lib/api/client";
import type { AccountInfo } from "@/lib/types";

export function getAccount(): Promise<AccountInfo> {
  return apiFetch<AccountInfo>("/account");
}
