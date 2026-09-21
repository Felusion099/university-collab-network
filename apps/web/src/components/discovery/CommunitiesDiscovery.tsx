import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, Users, Calendar, Check, Search, ExternalLink } from 'lucide-react';

export const CommunitiesDiscovery: React.FC = () => {
  const { communities, toggleJoinCommunity, currentUser, globalSearch, setGlobalSearch, openUserProfile, users } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Tech Society', 'Research Lab', 'Design Studio', 'Club'];

  const filteredCommunities = communities.filter((c) => {
    const term = globalSearch.toLowerCase().trim();
    if (term) {
      const matchName = c.name.toLowerCase().includes(term);
      const matchDesc = c.description.toLowerCase().includes(term);
      const matchCat = c.category.toLowerCase().includes(term);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    if (selectedCategory !== 'all' && c.category !== selectedCategory) {
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
            Campus Communities & Research Labs
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            Connect with student engineering guilds, design collectives, and academic research groups.
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          <strong className="text-zinc-900">{filteredCommunities.length}</strong> active student societies & labs
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
            placeholder="Search communities, clubs, or labs..."
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
              {cat === 'all' ? 'All Communities' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {filteredCommunities.map((comm) => {
          const isMember = comm.members.includes(currentUser.id);

          return (
            <div
              key={comm.id}
              className="bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Cover Banner */}
              <div className="h-32 w-full relative bg-zinc-100">
                <img
                  src={comm.coverImage}
                  alt={comm.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-zinc-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-zinc-200">
                  {comm.category}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 relative pt-0">
                {/* Logo overlapping banner */}
                <div className="-mt-7 mb-3 flex items-end justify-between">
                  <img
                    src={comm.logo}
                    alt={comm.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm bg-white"
                  />
                  <button
                    onClick={() => toggleJoinCommunity(comm.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      isMember
                        ? 'bg-zinc-100 text-zinc-800 border border-zinc-200 hover:bg-zinc-200'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    {isMember ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Member</span>
                      </>
                    ) : (
                      <span>Join Society</span>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-base text-zinc-900">{comm.name}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">@{comm.handle} · {comm.university}</p>

                <p className="text-xs text-zinc-600 mt-3 leading-relaxed line-clamp-3">
                  {comm.description}
                </p>

                {/* Upcoming Event */}
                {comm.upcomingEventTitle && (
                  <div className="mt-4 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Next Campus Event
                      </span>
                      <span className="font-medium text-zinc-800 truncate block">
                        {comm.upcomingEventTitle}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer stats & leads */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>
                      <strong className="text-zinc-900">{comm.memberCount}</strong> Members
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-zinc-400">Leads:</span>
                    {comm.leads.map((leadId) => {
                      const leadUser = users.find((u) => u.id === leadId);
                      if (!leadUser) return null;
                      return (
                        <span
                          key={leadId}
                          onClick={() => openUserProfile(leadId)}
                          className="font-medium text-zinc-700 hover:underline cursor-pointer"
                        >
                          {leadUser.name.split(' ')[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
