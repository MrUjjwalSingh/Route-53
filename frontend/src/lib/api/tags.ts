import { apiFetch } from "@/lib/api/client";
import type { TagItem } from "@/lib/types";

export function getZoneTags(zoneId: string): Promise<TagItem[]> {
  return apiFetch<TagItem[]>(`/hosted-zones/${zoneId}/tags`);
}

export function setZoneTags(zoneId: string, tags: TagItem[]): Promise<TagItem[]> {
  return apiFetch<TagItem[]>(`/hosted-zones/${zoneId}/tags`, {
    method: "PUT",
    body: { tags },
  });
}
