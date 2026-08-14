import { apiFetch } from "@/lib/api/client";
import type { DnsRecord, Paginated, RecordWithChange } from "@/lib/types";

export interface ListRecordsParams {
  search?: string;
  type?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export function listRecords(
  zoneId: string,
  params: ListRecordsParams = {}
): Promise<Paginated<DnsRecord>> {
  return apiFetch<Paginated<DnsRecord>>(`/hosted-zones/${zoneId}/records`, {
    query: { ...params },
  });
}

export function getRecord(zoneId: string, recordId: string): Promise<DnsRecord> {
  return apiFetch<DnsRecord>(`/hosted-zones/${zoneId}/records/${recordId}`);
}

export interface RecordInput {
  name: string;
  type: string;
  ttl: number | null;
  values: string[];
  routing_policy: string;
  set_identifier?: string | null;
  weight?: number | null;
  alias?: boolean;
  alias_target?: string | null;
  evaluate_target_health?: boolean;
  health_check_id?: string | null;
}

export function createRecord(zoneId: string, input: RecordInput): Promise<RecordWithChange> {
  return apiFetch<RecordWithChange>(`/hosted-zones/${zoneId}/records`, {
    method: "POST",
    body: input,
  });
}

export interface RecordUpdateInput {
  ttl?: number | null;
  values?: string[];
  routing_policy?: string;
  set_identifier?: string | null;
  weight?: number | null;
  alias?: boolean;
  alias_target?: string | null;
  evaluate_target_health?: boolean;
  health_check_id?: string | null;
}

export function updateRecord(
  zoneId: string,
  recordId: string,
  input: RecordUpdateInput
): Promise<RecordWithChange> {
  return apiFetch<RecordWithChange>(`/hosted-zones/${zoneId}/records/${recordId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteRecord(zoneId: string, recordId: string): Promise<void> {
  return apiFetch<void>(`/hosted-zones/${zoneId}/records/${recordId}`, { method: "DELETE" });
}
