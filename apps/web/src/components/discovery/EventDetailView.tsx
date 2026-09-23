import React from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/VerificationBadge';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Building2,
} from 'lucide-react';

/** Full event detail view — "Information → page/section" (Phase 9): events
 * open a dedicated experience instead of a tiny popup. */
export const EventDetailView: React.FC = () => {
  const {
    selectedEventId,
    setSelectedEventId,
    events,
    users,
    toggleRsvpEvent,
    openUserProfile,
  } = useApp();

  const event = events.find((e) => e.id === selectedEventId);

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-zinc-500">Event not found.</p>
        <button
          onClick={() => setSelectedEventId(null)}
          className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const fillPercent = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in-up">
      <button
        onClick={() => setSelectedEventId(null)}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </button>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            {event.category}
          </span>
          {event.isRegistered && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              You're registered
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">{event.title}</h1>
        <p className="text-sm text-zinc-600 leading-relaxed mt-3">{event.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {[
            { icon: CalendarDays, label: 'Date', value: event.date },
            { icon: Clock, label: 'Time', value: event.time || 'TBA' },
            { icon: MapPin, label: 'Venue', value: event.venue },
            { icon: Building2, label: 'Organizer', value: event.organizer },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                <Icon className="w-3 h-3" />
                {label}
              </div>
              <p className="text-sm font-medium text-zinc-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Capacity */}
        {event.capacity > 0 && (
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {event.registeredCount} of {event.capacity} registered
              </span>
              <span>{fillPercent}% full</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${fillPercent}%` }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center gap-2">
          <button
            onClick={() => toggleRsvpEvent(event.id)}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition ${
              event.isRegistered
                ? 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            {event.isRegistered ? 'Unregister' : 'Register / RSVP'}
          </button>
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 ml-2">
              {event.tags.map((t, i) => (
                <span key={`${t}-${i}`} className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
