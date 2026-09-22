import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { liveCreateStartup } from '../../services/api/live';
import { VerificationBadge } from '../common/VerificationBadge';
import {
  Rocket,
  Search,
  ExternalLink,
  Users,
  Sparkles,
  Building2,
  GraduationCap,
  Plus,
} from 'lucide-react';
import type { Startup } from '../../types';

const STATUS_PILLS: Record<Startup['status'], { label: string; cls: string }> = {
  ongoing: { label: 'Ongoing', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  incubated: { label: 'Incubated', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  graduated: { label: 'Graduated', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  completed: { label: 'Completed', cls: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
};

/** Startups — the university ecosystem's hatchery: ongoing/incubated/graduated
 * ventures that progressed BEYOND the initial project phase (very early ideas
 * stay under Projects). Admin-curated entries. */
export const StartupsView: React.FC = () => {
  const {
    startups,
    users,
    currentUser,
    setActiveTab,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Startup | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', industry: '', stage: 'ongoing', websiteUrl: '', hiring: false });
  const [createBusy, setCreateBusy] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createBusy || !form.name.trim()) return;
    setCreateBusy(true);
    try {
      await liveCreateStartup({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        industry: form.industry.trim() || undefined,
        stage: form.stage,
        websiteUrl: form.websiteUrl.trim() || undefined,
        hiring: form.hiring,
      });
      showToast('Startup added to the directory.');
      setIsCreateOpen(false);
      setForm({ name: '', description: '', industry: '', stage: 'ongoing', websiteUrl: '', hiring: false });
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Could not add the startup.';
      showToast(msg, 'error');
    } finally {
      setCreateBusy(false);
    }
  };

  const isAdmin = currentUser.role === 'council_admin';

  const filtered = startups.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    if (term && !(`${s.name} ${s.description} ${s.industry} ${s.category}`.toLowerCase().includes(term))) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  const founderNames = (s: Startup) =>
    s.founders.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page identity header */}
      <div className="pb-6 border-b border-zinc-200">
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="w-5 h-5 text-indigo-600" />
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Startups</h2>
        </div>
        <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
          Ventures that grew out of the university ecosystem — ongoing, incubated and graduated
          startups founded by campus students. Early-stage ideas live under Projects until they take off.
        </p>
      </div>

      {/* Admin: add a startup entry */}
      {isAdmin && (
        <div className='pt-4'>
          <button
            onClick={() => setIsCreateOpen(true)}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-800 text-xs font-medium hover:bg-zinc-50 transition'
          >
            <Plus className='w-3.5 h-3.5' />
            Add Startup Entry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="py-4 flex flex-wrap items-center gap-3 border-b border-zinc-100">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search startups, industries..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 text-xs">
          {['all', 'ongoing', 'incubated', 'graduated', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                statusFilter === s ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="text-xs text-zinc-500 ml-auto">
          <strong className="text-zinc-900">{filtered.length}</strong> ventures
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200 mt-6">
          <Rocket className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-900">No startups here yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Startups appear here once they progress beyond the initial project phase —
            curated by the university council as ventures incubated on campus.
          </p>
          <button
            onClick={() => setActiveTab('projects')}
            className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium"
          >
            Explore Early-Stage Projects
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {filtered.map((s) => {
            const pills = STATUS_PILLS[s.status];
            const founders = founderNames(s);
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-900/20 hover:shadow-sm transition"
              >
                <div className="flex items-start gap-3">
                  <img src={s.logo} alt="" className="w-12 h-12 rounded-xl object-cover border border-zinc-200" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => setSelected(s)}
                        className="font-bold text-sm text-zinc-900 hover:underline cursor-pointer truncate"
                      >
                        {s.name}
                      </h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${pills.cls}`}>
                        {pills.label}
                      </span>
                      {s.hiring && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Hiring
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {s.industry || s.category} · Founded {s.createdAt}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed mt-3 line-clamp-2">{s.description}</p>

                {founders.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex -space-x-2">
                      {s.founders.slice(0, 4).map((id) => {
                        const u = users.find((x) => x.id === id);
                        return u ? (
                          <img key={id} src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover border-2 border-white" />
                        ) : null;
                      })}
                    </div>
                    <span className="text-[11px] text-zinc-500 truncate">
                      {founders.slice(0, 2).join(', ')}
                      {founders.length > 2 ? ` +${founders.length - 2}` : ''}
                    </span>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {s.memberCount} team member{s.memberCount === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-2">
                    {s.websiteUrl && (
                      <a
                        href={s.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                      >
                        Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => setSelected(s)}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin create modal */}
      {isCreateOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto'
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className='relative w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 my-8'
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className='text-lg font-bold text-zinc-900 tracking-tight mb-1'>Add Startup Entry</h3>
            <p className='text-xs text-zinc-500 mb-4'>
              Admin-curated ventures — ongoing, incubated or graduated startups from the university ecosystem.
            </p>
            <form onSubmit={handleCreate} className='space-y-3 text-xs'>
              <div>
                <label className='block font-medium text-zinc-700 mb-1'>Startup name</label>
                <input type='text' required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className='w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500' />
              </div>
              <div>
                <label className='block font-medium text-zinc-700 mb-1'>Story / description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className='w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500' />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block font-medium text-zinc-700 mb-1'>Industry</label>
                  <input type='text' value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder='e.g. SaaS, Robotics' className='w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500' />
                </div>
                <div>
                  <label className='block font-medium text-zinc-700 mb-1'>Status</label>
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className='w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:border-zinc-500'>
                    <option value='ongoing'>Ongoing</option>
                    <option value='incubated'>Incubated</option>
                    <option value='graduated'>Graduated</option>
                    <option value='completed'>Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className='block font-medium text-zinc-700 mb-1'>Website (optional)</label>
                <input type='url' value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder='https://...' className='w-full px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-500' />
              </div>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input type='checkbox' checked={form.hiring} onChange={(e) => setForm({ ...form, hiring: e.target.checked })} className='rounded border-zinc-300' />
                <span className='text-zinc-700 font-medium'>Currently hiring</span>
              </label>
              <div className='flex justify-end gap-2 pt-3 border-t border-zinc-100'>
                <button type='button' onClick={() => setIsCreateOpen(false)} className='px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium'>
                  Cancel
                </button>
                <button type='submit' disabled={createBusy} className='px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium disabled:opacity-60'>
                  Add Startup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail overlay */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <img src={selected.logo} alt="" className="w-14 h-14 rounded-xl object-cover border border-zinc-200 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{selected.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${STATUS_PILLS[selected.status].cls}`}>
                      {STATUS_PILLS[selected.status].label}
                    </span>
                    <span className="text-[11px] text-zinc-500">{selected.industry || selected.category}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-1.5">The Story</h4>
                <p className="text-zinc-600 leading-relaxed">
                  {selected.description || 'This venture grew out of the university ecosystem — founded by campus students and incubated through campus projects.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    <GraduationCap className="w-3 h-3" />
                    University Connection
                  </div>
                  <p className="text-zinc-700">{selected.university}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    <Sparkles className="w-3 h-3" />
                    Stage
                  </div>
                  <p className="text-zinc-700 capitalize">{selected.stage.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {selected.founders.length > 0 && (
                <div>
                  <h4 className="font-semibold text-zinc-900 text-sm mb-2">Founders & Team</h4>
                  <div className="space-y-2">
                    {selected.founders.map((id) => {
                      const u = users.find((x) => x.id === id);
                      if (!u) return null;
                      return (
                        <div key={id} className="flex items-center gap-2.5">
                          <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
                          <div className="min-w-0">
                            <div className="font-medium text-zinc-900 flex items-center gap-1.5">
                              {u.name}
                              <VerificationBadge verification={u.verification} size="sm" />
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate">{u.department}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected.websiteUrl && (
                <a
                  href={selected.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium"
                >
                  Visit Website
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
