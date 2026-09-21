import React from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Sparkles, Users, Briefcase, ArrowRight } from 'lucide-react';
import { ActiveTab } from '../../types';

export const HeroSearch: React.FC = () => {
  const {
    globalSearch,
    setGlobalSearch,
    setActiveTab,
    setIsProjectCreateOpen,
    projects,
    users,
    services,
  } = useApp();

  const handleQuickTagClick = (tag: string, targetTab?: ActiveTab) => {
    setGlobalSearch(tag);
    if (targetTab) {
      setActiveTab(targetTab);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      setActiveTab('people');
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-zinc-50 via-white to-white border-b border-zinc-200/70 pt-12 pb-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Subtle Category Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/90 border border-zinc-200/80 text-zinc-700 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>University Ecosystem · Research, Hackathons & Talent Marketplace</span>
        </div>

        {/* Display Typography Headline */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 max-w-3xl mx-auto leading-[1.15]">
          Find talented collaborators, faculty labs & student services to build with.
        </h1>

        {/* Refined Subtitle */}
        <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto mt-4 leading-relaxed">
          Connect with vetted peers, join high-impact research projects, form hackathon teams, or commission campus creators.
        </p>

        {/* Global Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 max-w-2xl mx-auto relative flex items-center shadow-lg shadow-zinc-200/50 rounded-2xl bg-white border border-zinc-200 p-1.5 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100 transition-all"
        >
          <div className="pl-3.5 text-zinc-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search developers, designers, faculty labs, hackathons, or skills..."
            className="w-full px-3 py-2.5 text-sm text-zinc-900 bg-transparent focus:outline-none placeholder:text-zinc-400"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              className="text-xs text-zinc-400 hover:text-zinc-600 px-2"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
          <span className="font-medium text-zinc-400">Popular:</span>
          {[
            { label: 'Autonomous Swarms', tab: 'projects' as ActiveTab },
            { label: 'Figma UI Systems', tab: 'services' as ActiveTab },
            { label: 'Machine Learning', tab: 'people' as ActiveTab },
            { label: 'ESP32 Firmware', tab: 'people' as ActiveTab },
            { label: 'Assistive Tech', tab: 'projects' as ActiveTab },
          ].map((tag) => (
            <button
              key={tag.label}
              onClick={() => handleQuickTagClick(tag.label, tag.tab)}
              className="px-2.5 py-1 rounded-md bg-zinc-100/70 hover:bg-zinc-200/70 text-zinc-700 transition-colors border border-zinc-200/50"
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Quick Stats Banner */}
        <div className="mt-10 grid grid-cols-3 max-w-lg mx-auto divide-x divide-zinc-200 border-t border-zinc-200/80 pt-6">
          <div>
            <div className="text-xl font-bold text-zinc-900">{users.length}</div>
            <div className="text-[11px] text-zinc-500 font-medium mt-0.5">Scholars & Builders</div>
          </div>
          <div>
            <div className="text-xl font-bold text-zinc-900">{projects.length} Active</div>
            <div className="text-[11px] text-zinc-500 font-medium mt-0.5">Teams Seeking Collaborators</div>
          </div>
          <div>
            <div className="text-xl font-bold text-zinc-900">{services.length} Offered</div>
            <div className="text-[11px] text-zinc-500 font-medium mt-0.5">Campus Creator Services</div>
          </div>
        </div>

      </div>
    </div>
  );
};
