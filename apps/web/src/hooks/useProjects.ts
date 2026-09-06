import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { projectsApi, type ProjectListParams } from "@/services/api/projects";

export function useProjectsList(params: Omit<ProjectListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["projects", params],
    queryFn: ({ pageParam }) => projectsApi.list({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id!),
    enabled: Boolean(id),
  });
}
