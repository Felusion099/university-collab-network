import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bookmark, Users, Briefcase, Sparkles, Calendar, Trash2 } from 'lucide-react';

export const SavedItemsView: React.FC = () => {
  const {
    savedItems,
    toggleSaveItem,
    currentUser,
    users,
    projects,
    services,
    events,
    openUserProfile,
    openProjectDetails,
    openServiceDetails,
    setActiveTab,
  } = useApp();

  const [activeType, setActiveType] = useState<'all' | 'person' | 'project' | 'service' | 'event'>('all');

  // Scope to the signed-in persona — bookmarks are per-user
  const myItems = savedItems.filter((s) => s.userId === currentUser.id);
  const filteredItems = myItems.filter((s) => {
    if (activeType === 'all') return true;
    return s.itemType === activeType;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600 fill-current" />
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Saved Bookmarks</h2>
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            Access your bookmarked students, faculty, projects, services, and upcoming campus events.
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          <strong className="text-zinc-900">{myItems.length}</strong> total saved items
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 py-4 border-b border-zinc-100 overflow-x-auto text-xs font-medium">
        {[
          { id: 'all', label: `All (${myItems.length})` },
          { id: 'person', label: 'People' },
          { id: 'project', label: 'Projects' },
          { id: 'service', label: 'Services' },
          { id: 'event', label: 'Events' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveType(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeType === tab.id
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200 mt-6">
          <Bookmark className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-900">No saved items found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Click the bookmark icon on any person, project, service, or event card to save it here for quick access.
          </p>
          <button
            onClick={() => setActiveTab('people')}
            className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium"
          >
            Explore Campus Members
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {filteredItems.map((item) => {
            if (item.itemType === 'person') {
              const person = users.find((u) => u.id === item.itemId);
              if (!person) return null;
              return (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-zinc-200 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                    />
                    <div>
                      <div
                        onClick={() => openUserProfile(person.id)}
                        className="font-bold text-xs text-zinc-900 hover:underline cursor-pointer"
                      >
                        {person.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">{person.headline}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSaveItem('person', person.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            if (item.itemType === 'project') {
              const project = projects.find((p) => p.id === item.itemId);
              if (!project) return null;
              return (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-zinc-200 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                      {project.category}
                    </span>
                    <h4
                      onClick={() => setActiveTab('projects')}
                      className="font-bold text-xs text-zinc-900 mt-1 hover:underline cursor-pointer"
                    >
                      {project.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 line-clamp-1">{project.description}</p>
                  </div>
                  <button
                    onClick={() => toggleSaveItem('project', project.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            if (item.itemType === 'service') {
              const service = services.find((s) => s.id === item.itemId);
              if (!service) return null;
              return (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-zinc-200 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                      {service.category}
                    </span>
                    <h4
                      onClick={() => setActiveTab('services')}
                      className="font-bold text-xs text-zinc-900 mt-1 hover:underline cursor-pointer line-clamp-1"
                    >
                      {service.title}
                    </h4>
                    <div className="text-[11px] text-zinc-500">Starting at {service.startingPrice}</div>
                  </div>
                  <button
                    onClick={() => toggleSaveItem('service', service.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            if (item.itemType === 'event') {
              const event = events.find((e) => e.id === item.itemId);
              if (!event) return null;
              return (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-zinc-200 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                      {event.category}
                    </span>
                    <h4
                      onClick={() => setActiveTab('events')}
                      className="font-bold text-xs text-zinc-900 mt-1 hover:underline cursor-pointer"
                    >
                      {event.title}
                    </h4>
                    <div className="text-[11px] text-zinc-500">{event.date} · {event.venue}</div>
                  </div>
                  <button
                    onClick={() => toggleSaveItem('event', event.id)}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
