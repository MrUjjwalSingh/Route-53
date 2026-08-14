import { apiFetch } from "@/lib/api/client";
import type { HostedZoneDetail, Paginated, TagItem, ZoneType, ZoneWithChange } from "@/lib/types";
import type { HostedZone } from "@/lib/types";

export interface ListZonesParams {
  search?: string;
  type?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export function listZones(params: ListZonesParams = {}): Promise<Paginated<HostedZone>> {
  return apiFetch<Paginated<HostedZone>>("/hosted-zones", { query: { ...params } });
}

export function getZone(zoneId: string): Promise<HostedZoneDetail> {
  return apiFetch<HostedZoneDetail>(`/hosted-zones/${zoneId}`);
}

export interface CreateZoneInput {
  name: string;
  type: ZoneType;
  comment?: string | null;
  tags?: TagItem[];
}

export function createZone(input: CreateZoneInput): Promise<ZoneWithChange> {
  return apiFetch<ZoneWithChange>("/hosted-zones", { method: "POST", body: input });
}

export interface UpdateZoneInput {
  name?: string;
  comment?: string | null;
}

export function updateZone(zoneId: string, input: UpdateZoneInput): Promise<HostedZoneDetail> {
  return apiFetch<HostedZoneDetail>(`/hosted-zones/${zoneId}`, { method: "PATCH", body: input });
}

export function deleteZone(zoneId: string): Promise<void> {
  return apiFetch<void>(`/hosted-zones/${zoneId}`, { method: "DELETE" });
}
