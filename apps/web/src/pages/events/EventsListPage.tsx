import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { EventType } from "@app/shared-types";
import { useEventsList } from "@/hooks/useEvents";
import { EventCard } from "@/components/cards/EventCard";
import { FilterPanel } from "@/components/FilterPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "hackathon", label: "Hackathon" },
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "conference", label: "Conference" },
  { value: "talk", label: "Talk" },
  { value: "guest_lecture", label: "Guest Lecture" },
  { value: "competition", label: "Competition" },
  { value: "startup_event", label: "Startup Event" },
  { value: "club_event", label: "Club Event" },
];

export default function EventsListPage(): JSX.Element {
  const [eventType, setEventType] = useState<EventType | undefined>(undefined);
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useEventsList({ eventType });

  const events = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Events</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Hackathons, workshops, talks, and club events happening on campus.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <FilterPanel
          className="w-full flex-shrink-0 md:w-48"
          groups={[{ label: "Type", key: "eventType", options: EVENT_TYPE_OPTIONS }]}
          activeValues={{ eventType }}
          onChange={(_key, value) => setEventType(value as EventType | undefined)}
        />

        <div className="min-w-0 flex-1 space-y-6">
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key -- static skeleton count, never reordered
                <EventCard.Skeleton key={i} />
              ))}
            </div>
          )}

          {isError && <ErrorState title="Couldn't load events" onRetry={() => refetch()} />}

          {!isLoading && !isError && events.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title="No events match this filter"
              description="Try a different type, or check back once more events are posted."
            />
          )}

          {!isLoading && !isError && events.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              {hasNextPage && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-md border border-border px-4 py-2 text-sm text-text-primary transition-colors hover:bg-sunken disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
