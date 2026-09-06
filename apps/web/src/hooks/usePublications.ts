import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { publicationsApi, type PublicationListParams } from "@/services/api/publications";

export function usePublicationsList(params: Omit<PublicationListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["publications", params],
    queryFn: ({ pageParam }) => publicationsApi.list({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function usePublication(id: string | undefined) {
  return useQuery({
    queryKey: ["publication", id],
    queryFn: () => publicationsApi.getById(id!),
    enabled: Boolean(id),
  });
}
