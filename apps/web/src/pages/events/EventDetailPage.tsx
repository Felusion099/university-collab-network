import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CalendarX, Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import { useEvent } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

const EVENT_TYPE_LABEL: Record<string, string> = {
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

export default function EventDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, isError, refetch } = useEvent(id);

  return (
    <div className="space-y-6">
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to events
      </Link>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {isError && <ErrorState title="Couldn't load this event" onRetry={() => refetch()} />}

      {!isLoading && !isError && !event && (
        <EmptyState icon={CalendarX} title="Event not found" />
      )}

      {!isLoading && !isError && event && (
        <div className="space-y-6">
          <div>
            <span className="inline-flex w-fit items-center rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700">
              {EVENT_TYPE_LABEL[event.eventType] ?? event.eventType}
            </span>
            <h1 className="mt-2 text-xl font-semibold text-text-primary">{event.title}</h1>
            {event.organizerName && (
              <p className="mt-0.5 text-sm text-text-secondary">
                Organized by {event.organizerName}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 text-sm text-text-primary">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 flex-shrink-0 text-text-muted" aria-hidden="true" />
              {formatDate(event.date)}
            </span>
            {event.time && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 flex-shrink-0 text-text-muted" aria-hidden="true" />
                {event.time}
              </span>
            )}
            {event.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 flex-shrink-0 text-text-muted" aria-hidden="true" />
                {event.venue}
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-text-primary">{event.description}</p>
          )}

          {event.registrationUrl && (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1.5 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700"
            >
              Register
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
