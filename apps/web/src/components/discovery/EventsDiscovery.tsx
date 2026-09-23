import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, MapPin, Users, Clock, CheckCircle2, Bookmark, Search } from 'lucide-react';

export const EventsDiscovery: React.FC = () => {
  const { events, toggleRsvpEvent, toggleSaveItem, isItemSaved, globalSearch, setGlobalSearch, openEventDetails } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Hackathon', 'Workshop', 'Seminar', 'Exhibition'];

  const filteredEvents = events.filter((ev) => {
    const term = globalSearch.toLowerCase().trim();
    if (term) {
      const matchTitle = ev.title.toLowerCase().includes(term);
      const matchDesc = ev.description.toLowerCase().includes(term);
      const matchVenue = ev.venue.toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchVenue) return false;
    }
    if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Campus Hackathons & Technical Events
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            Browse upcoming university hackathons, lab open houses, design workshops, and startup demo days.
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          <strong className="text-zinc-900">{filteredEvents.length}</strong> upcoming campus events
        </div>
      </div>

      {/* Filter Bar */}
      <div className="py-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search hackathons, seminars, venues..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs capitalize font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80'
              }`}
            >
              {cat === 'all' ? 'All Events' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4 mt-4">
        {filteredEvents.map((ev) => {
          const isSaved = isItemSaved('event', ev.id);
          const capacityPercent = Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100));

          return (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-zinc-200/90 hover:border-zinc-300 hover:shadow-md transition-all p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                {/* Date Badge */}
                <div className="w-16 h-16 rounded-xl bg-zinc-900 text-white flex flex-col items-center justify-center shrink-0 shadow-xs text-center p-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    {ev.date.split(' ')[0]}
                  </span>
                  <span className="text-lg font-bold leading-tight">
                    {ev.date.split(' ')[1] || '24'}
                  </span>
                  <span className="text-[9px] text-zinc-400">2026</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {ev.category}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      Organized by {ev.organizer}
                    </span>
                  </div>

                  <h3
                    onClick={() => openEventDetails(ev.id)}
                    className="text-base font-bold text-zinc-900 mt-1 hover:underline cursor-pointer"
                  >
                    {ev.title}
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {ev.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {ev.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      {ev.registeredCount} / {ev.capacity} spots filled ({capacityPercent}%)
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {ev.tags.map((tag, i) => (
                      <span
                        key={`${tag}-${i}`}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => toggleSaveItem('event', ev.id)}
                  className={`p-2 rounded-lg border transition-colors ${
                    isSaved
                      ? 'border-blue-200 bg-blue-50 text-blue-600'
                      : 'border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                  }`}
                  title={isSaved ? 'Saved to bookmarks' : 'Save event'}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => toggleRsvpEvent(ev.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                    ev.isRegistered
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  {ev.isRegistered ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>RSVP Confirmed</span>
                    </>
                  ) : (
                    <span>Register / RSVP</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
