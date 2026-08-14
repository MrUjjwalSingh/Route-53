import { apiFetch } from "@/lib/api/client";
import type { ChangeInfo } from "@/lib/types";

export function getChange(changeId: string): Promise<ChangeInfo> {
  return apiFetch<ChangeInfo>(`/changes/${changeId}`);
}
