import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createZone,
  deleteZone,
  getZone,
  listZones,
  updateZone,
  type CreateZoneInput,
  type ListZonesParams,
  type UpdateZoneInput,
} from "@/lib/api/zones";

export function useZones(params: ListZonesParams = {}) {
  return useQuery({
    queryKey: ["zones", params],
    queryFn: () => listZones(params),
  });
}

export function useZone(zoneId: string | undefined) {
  return useQuery({
    queryKey: ["zones", zoneId],
    queryFn: () => getZone(zoneId as string),
    enabled: !!zoneId,
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateZoneInput) => createZone(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useUpdateZone(zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateZoneInput) => updateZone(zoneId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (zoneId: string) => deleteZone(zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}
