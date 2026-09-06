import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { researchTeamsApi, type ResearchTeamListParams } from "@/services/api/researchTeams";

export function useResearchTeamsList(params: Omit<ResearchTeamListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["research-teams", params],
    queryFn: ({ pageParam }) => researchTeamsApi.list({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useResearchTeam(id: string | undefined) {
  return useQuery({
    queryKey: ["research-team", id],
    queryFn: () => researchTeamsApi.getById(id!),
    enabled: Boolean(id),
  });
}
