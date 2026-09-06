import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { UserRole } from "@app/shared-types";
import { directoryApi, type DirectoryListParams } from "@/services/api/directory";

/**
 * Powers /students, /professors, /researchers. `useInfiniteQuery` matches
 * API_CONTRACT.md §0's cursor pagination shape (`{ data, nextCursor }`)
 * directly — swapping `directoryApi.list`'s body for a real `apiFetch`
 * call later (HANDOFF-22) needs no change here.
 */
export function useDirectoryList(params: Omit<DirectoryListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["directory", params],
    queryFn: ({ pageParam }) => directoryApi.list({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useDirectoryUser(role: UserRole, username: string | undefined) {
  return useQuery({
    queryKey: ["directory-user", role, username],
    queryFn: () => directoryApi.getByUsername(username!),
    enabled: Boolean(username),
  });
}
