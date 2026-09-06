import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { opportunitiesApi, type OpportunityListParams } from "@/services/api/opportunities";

export function useOpportunitiesList(params: Omit<OpportunityListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["opportunities", params],
    queryFn: ({ pageParam }) => opportunitiesApi.list({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useOpportunity(id: string | undefined) {
  return useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => opportunitiesApi.getById(id!),
    enabled: Boolean(id),
  });
}
