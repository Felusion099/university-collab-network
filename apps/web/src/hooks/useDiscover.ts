import { useQuery } from "@tanstack/react-query";
import { discoverApi } from "@/services/api/discover";

export function useDiscover(query: string) {
  return useQuery({
    queryKey: ["discover", query],
    queryFn: () => (query.trim() ? discoverApi.search(query) : discoverApi.getRecommendations()),
  });
}
