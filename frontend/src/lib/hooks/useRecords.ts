import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  updateRecord,
  type ListRecordsParams,
  type RecordInput,
  type RecordUpdateInput,
} from "@/lib/api/records";

export function useRecords(zoneId: string, params: ListRecordsParams = {}) {
  return useQuery({
    queryKey: ["records", zoneId, params],
    queryFn: () => listRecords(zoneId, params),
    enabled: !!zoneId,
  });
}

export function useRecord(zoneId: string, recordId: string | undefined) {
  return useQuery({
    queryKey: ["records", zoneId, "detail", recordId],
    queryFn: () => getRecord(zoneId, recordId as string),
    enabled: !!zoneId && !!recordId,
  });
}

export function useCreateRecord(zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordInput) => createRecord(zoneId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", zoneId] });
      queryClient.invalidateQueries({ queryKey: ["zones", zoneId] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useUpdateRecord(zoneId: string, recordId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordUpdateInput) => updateRecord(zoneId, recordId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", zoneId] });
    },
  });
}

export function useDeleteRecord(zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => deleteRecord(zoneId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["records", zoneId] });
      queryClient.invalidateQueries({ queryKey: ["zones", zoneId] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}
