import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getZoneTags, setZoneTags } from "@/lib/api/tags";
import type { TagItem } from "@/lib/types";

export function useZoneTags(zoneId: string) {
  return useQuery({
    queryKey: ["zones", zoneId, "tags"],
    queryFn: () => getZoneTags(zoneId),
  });
}

export function useSetZoneTags(zoneId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tags: TagItem[]) => setZoneTags(zoneId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones", zoneId, "tags"] });
    },
  });
}
