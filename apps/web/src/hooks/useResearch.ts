import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { researchApi, type ResearchTopicListParams } from "@/services/api/research";

export function useResearchTopicsList(params: Omit<ResearchTopicListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["research-topics", params],
    queryFn: ({ pageParam }) => researchApi.list({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useResearchTopic(slug: string | undefined) {
  return useQuery({
    queryKey: ["research-topic", slug],
    queryFn: () => researchApi.getBySlug(slug!),
    enabled: Boolean(slug),
  });
}
