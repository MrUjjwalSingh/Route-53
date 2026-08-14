import { useQuery } from "@tanstack/react-query";

import { getAccount } from "@/lib/api/account";

export function useAccount() {
  return useQuery({
    queryKey: ["account"],
    queryFn: getAccount,
  });
}
