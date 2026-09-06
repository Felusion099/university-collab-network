import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { organizationsApi, type OrganizationListParams } from "@/services/api/organizations";

export function useOrganizationsList(params: Omit<OrganizationListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["organizations", params],
    queryFn: ({ pageParam }) => organizationsApi.list({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: () => organizationsApi.getById(id!),
    enabled: Boolean(id),
  });
}
