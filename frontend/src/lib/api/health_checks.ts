import { apiFetch } from "@/lib/api/client";
import type { HealthCheck, HealthCheckCreateInput, Paginated } from "@/lib/types";

export interface ListHealthChecksParams {
  page?: number;
  page_size?: number;
}

export function listHealthChecks(
  params: ListHealthChecksParams = {}
): Promise<Paginated<HealthCheck>> {
  return apiFetch<Paginated<HealthCheck>>("/health-checks", { query: { ...params } });
}

export function getHealthCheck(id: string): Promise<HealthCheck> {
  return apiFetch<HealthCheck>(`/health-checks/${id}`);
}

export function createHealthCheck(input: HealthCheckCreateInput): Promise<HealthCheck> {
  return apiFetch<HealthCheck>("/health-checks", {
    method: "POST",
    body: input,
  });
}

export interface HealthCheckUpdateInput {
  name?: string;
  protocol?: string;
  domain_name?: string;
  ip_address?: string;
  port?: number;
  resource_path?: string;
  search_string?: string;
  request_interval?: number;
  failure_threshold?: number;
  measure_latency?: boolean;
  inverted?: boolean;
  enable_sni?: boolean;
}

export function updateHealthCheck(
  id: string,
  input: HealthCheckUpdateInput
): Promise<HealthCheck> {
  return apiFetch<HealthCheck>(`/health-checks/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteHealthCheck(id: string): Promise<void> {
  return apiFetch<void>(`/health-checks/${id}`, { method: "DELETE" });
}
