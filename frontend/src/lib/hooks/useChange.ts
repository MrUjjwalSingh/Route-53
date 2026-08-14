import { useQuery } from "@tanstack/react-query";

import { getChange } from "@/lib/api/changes";

export function useChange(changeId: string | undefined) {
  return useQuery({
    queryKey: ["changes", changeId],
    queryFn: () => getChange(changeId as string),
    enabled: !!changeId,
    refetchInterval: (query) => (query.state.data?.status === "INSYNC" ? false : 2000),
  });
}
