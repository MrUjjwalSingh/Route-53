import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createHealthCheck,
  deleteHealthCheck,
  getHealthCheck,
  listHealthChecks,
  updateHealthCheck,
  type HealthCheckUpdateInput,
  type ListHealthChecksParams,
} from "@/lib/api/health_checks";
import type { HealthCheckCreateInput } from "@/lib/types";

export function useHealthChecks(params: ListHealthChecksParams = {}) {
  return useQuery({
    queryKey: ["health-checks", params],
    queryFn: () => listHealthChecks(params),
  });
}

export function useHealthCheck(id: string | undefined) {
  return useQuery({
    queryKey: ["health-checks", "detail", id],
    queryFn: () => getHealthCheck(id as string),
    enabled: !!id,
  });
}

export function useCreateHealthCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: HealthCheckCreateInput) => createHealthCheck(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-checks"] });
    },
  });
}

export function useUpdateHealthCheck(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: HealthCheckUpdateInput) => updateHealthCheck(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-checks"] });
    },
  });
}

export function useDeleteHealthCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHealthCheck(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-checks"] });
    },
  });
}
