import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { eventsApi, type EventListParams } from "@/services/api/events";

export function useEventsList(params: Omit<EventListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: ["events", params],
    queryFn: ({ pageParam }) => eventsApi.list({ ...params, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsApi.getById(id!),
    enabled: Boolean(id),
  });
}
