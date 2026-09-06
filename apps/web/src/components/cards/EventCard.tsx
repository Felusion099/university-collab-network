import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";
import type { EventSummary } from "@/services/api/events";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatDate } from "@/lib/utils";

const EVENT_TYPE_LABEL: Record<EventSummary["eventType"], string> = {
  hackathon: "Hackathon",
  workshop: "Workshop",
  seminar: "Seminar",
  conference: "Conference",
  talk: "Talk",
  guest_lecture: "Guest Lecture",
  competition: "Competition",
  startup_event: "Startup Event",
  club_event: "Club Event",
};

/** EventCard — ARCHITECTURE.md §5. */
export function EventCard({
  event,
  className,
}: {
  event: EventSummary;
  className?: string;
}): JSX.Element {
  return (
    <Link
      to={`/events/${event.id}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-raised p-4 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
    >
      <span className="inline-flex w-fit items-center rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
        {EVENT_TYPE_LABEL[event.eventType]}
      </span>
      <p className="font-medium text-text-primary">{event.title}</p>
      <div className="flex flex-col gap-1 text-sm text-text-secondary">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          {formatDate(event.date)}
          {event.time && (
            <>
              <span aria-hidden="true">·</span>
              <Clock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              {event.time}
            </>
          )}
        </span>
        {event.venue && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {event.venue}
          </span>
        )}
      </div>
    </Link>
  );
}

EventCard.Skeleton = function EventCardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-raised p-4">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
};
