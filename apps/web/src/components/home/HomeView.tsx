import React from 'react';
import {
  GraduationCap,
  ArrowRight,
  Users,
  FolderKanban,
  Wrench,
  CalendarDays,
  MessageSquare,
  TrendingUp,
  MapPin,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkillBadge } from '../common/SkillBadge';
import { VerificationBadge } from '../common/VerificationBadge';
import type { User, Project, CampusEvent } from '../../types';

const CATEGORY_PILLS = ['All', 'Hackathon', 'Research', 'Startup', 'Software'] as const;

export const HomeView: React.FC = () => {
  const {
    currentUser,
    users,
    projects,
    events,
    setActiveTab,
    openUserProfile,
    startConversationWithUser,
  } = useApp();

  const featuredProjects: Project[] = projects
    .filter((p) => p.status !== 'Completed')
    .slice(0, 3);

  const peopleToKnow: User[] = users
    .filter((u) => u.id !== currentUser.id && u.role !== 'council_admin')
    .slice(0, 4);

  const upcomingEvents: CampusEvent[] = events.slice(0, 3);

  const stats = [
    { icon: Users, label: 'People & Labs', value: `${users.length}`, tab: 'people' as const },
    { icon: FolderKanban, label: 'Open Projects', value: `${projects.filter((p) => p.status !== 'Completed').length}`, tab: 'projects' as const },
    { icon: CalendarDays, label: 'Upcoming Events', value: `${events.length}`, tab: 'events' as const },
  ];

  const greetingName = currentUser.name.split(' ')[0];

  return (
    <div className="animate-fade-in-up">
      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-900 text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-emerald-500 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-200 mb-5">
              <GraduationCap className="w-3.5 h-3.5" />
              University Collaboration Network
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-4">
              Welcome back, {greetingName}.
              <span className="block text-zinc-400">What will you build today?</span>
            </h1>
            <p className="text-zinc-300 leading-relaxed mb-8 max-w-xl">
              Discover the right people, projects, research and opportunities across
              campus — all in one verified network.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('projects')}
                className="inline-flex items-center gap-2 rounded-lg bg-white text-zinc-900 px-5 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition"
              >
                Explore Projects
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('people')}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition"
              >
                Find People
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition"
              >
                <MessageSquare className="w-4 h-4" />
                Messages
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="relative mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ icon: Icon, label, value, tab }) => (
              <button
                key={label}
                onClick={() => setActiveTab(tab)}
                className="group text-left rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 hover:bg-white/10 transition"
              >
                <Icon className="w-4 h-4 text-zinc-400 mb-2 group-hover:text-white transition" />
                <div className="text-xl font-bold">{value}</div>
                <div className="text-[11px] text-zinc-400 uppercase tracking-wide">{label}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Featured projects */}
        {featuredProjects.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
                Projects looking for collaborators
              </h2>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {featuredProjects.map((p) => {
                const owner = users.find((u) => u.id === p.ownerId);
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveTab('projects')}
                    className="text-left rounded-xl border border-zinc-200 bg-white p-5 hover:border-zinc-900/20 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                        {p.category}
                      </span>
                      <span className="text-[11px] text-zinc-500">{p.deadline || 'Rolling'}</span>
                    </div>
                    <h3 className="font-bold text-sm mb-1.5 line-clamp-1">{p.title}</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2 mb-3">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {owner && (
                          <>
                            <img src={owner.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                            <span className="text-[11px] text-zinc-600 truncate">{owner.name}</span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-indigo-600">
                        {p.requiredRoles.length > 0 ? `${p.requiredRoles.length} role${p.requiredRoles.length > 1 ? 's' : ''} open` : 'Open'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* People to know */}
          {peopleToKnow.length > 0 && (
            <section className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight">People to know</h2>
                <button
                  onClick={() => setActiveTab('people')}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {peopleToKnow.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-900/20 transition"
                  >
                    <div className="flex items-start gap-3">
                      <button onClick={() => openUserProfile(u.id)} className="shrink-0">
                        <img src={u.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openUserProfile(u.id)}
                            className="font-semibold text-sm truncate hover:underline"
                          >
                            {u.name}
                          </button>
                          <VerificationBadge verification={u.verification} />
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">{u.headline || u.department}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {u.skills.slice(0, 2).map((s) => (
                            <SkillBadge key={s} skill={s} variant="subtle" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => startConversationWithUser(u.id)}
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 py-1.5 text-[11px] font-semibold hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Message
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming events */}
          {upcomingEvents.length > 0 && (
            <section className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight">Happening on campus</h2>
                <button
                  onClick={() => setActiveTab('events')}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-3">
                {upcomingEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setActiveTab('events')}
                    className="w-full text-left rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-900/20 transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                        {ev.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-1 line-clamp-1">{ev.title}</h3>
                    <div className="flex flex-col gap-1 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {ev.date}
                        {ev.time ? ` · ${ev.time}` : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {ev.venue}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Category quick access */}
        <section>
          <h2 className="text-lg font-bold tracking-tight mb-4">Browse by category</h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_PILLS.map((cat) =>
              cat === 'All' ? null : (
                <button
                  key={cat}
                  onClick={() => setActiveTab('projects')}
                  className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition"
                >
                  {cat}
                </button>
              ),
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
