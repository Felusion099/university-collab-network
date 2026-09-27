import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/api/client';
import { Globe, Lock, Plus, Search, Users, X } from 'lucide-react';
import { Modal } from '../common/Modal';

export interface SpaceListItem {
  id: string;
  name: string;
  description: string | null;
  type: string;
  visibility: string;
  membershipMode: string;
  linkedProject: { id: string; name: string } | null;
  memberCount: number;
  isMember: boolean;
}

const SPACE_TYPES = [
  { id: 'community', label: 'Community' },
  { id: 'club', label: 'Club' },
  { id: 'research', label: 'Research group' },
  { id: 'study_group', label: 'Study group' },
  { id: 'startup', label: 'Startup team' },
  { id: 'other', label: 'Other' },
];

/** Collaboration Spaces discovery — ONE reusable architecture (Phase CS).
 * Lists public/university_only spaces (private never listed), creates
 * independent spaces, and opens space details. */
export const SpacesView: React.FC<{ onOpenSpace: (id: string) => void }> = ({ onOpenSpace }) => {
  const [spaces, setSpaces] = useState<SpaceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '30');
      const res = await apiFetch<{ data: SpaceListItem[] }>(`/spaces?${params.toString()}`);
      setSpaces(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spaces');
    } finally {
      setLoading(false);
    }
  }, [query, typeFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Collaboration Spaces</h1>
          <p className="text-sm text-zinc-600 mt-1">
            The communication layer for projects, clubs, research and study groups — one shared space per team.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Create space
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mt-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search spaces…"
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 text-xs border border-zinc-300 rounded-xl bg-white focus:outline-none"
        >
          <option value="">All types</option>
          {SPACE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-xs text-zinc-400 text-center py-10">Loading spaces…</p>}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-3.5 py-2.5 text-xs">{error}</div>
      )}
      {!loading && !error && spaces.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-700 mt-3">No spaces found</p>
          <p className="text-xs text-zinc-500 mt-1">Create one — a study group, a club, a research discussion.</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {spaces.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpenSpace(s.id)}
            className="text-left bg-white rounded-2xl border border-zinc-200 p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-zinc-900">{s.name}</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {s.type.replace('_', ' ')}
              </span>
              {s.visibility === 'public' ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600"><Globe className="w-3 h-3" /> Public</span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-zinc-500"><Lock className="w-3 h-3" /> {s.visibility.replace('_', ' ')}</span>
              )}
            </div>
            {s.description && <p className="text-xs text-zinc-600 mt-1.5 line-clamp-2">{s.description}</p>}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> {s.memberCount} members
              </span>
              {s.linkedProject && (
                <span className="text-[11px] text-indigo-600">project: {s.linkedProject.name}</span>
              )}
              {s.isMember && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Joined
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <CreateSpaceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => {
          setIsCreateOpen(false);
          onOpenSpace(id);
        }}
      />
    </div>
  );
};

const CreateSpaceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('community');
  const [visibility, setVisibility] = useState('public');
  const [membershipMode, setMembershipMode] = useState('request_to_join');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch<{ id: string }>('/spaces', {
        method: 'POST',
        body: { name: name.trim(), description: description.trim() || undefined, type, visibility, membershipMode },
      });
      onCreated(res.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create space');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Collaboration Space">
      <div className="space-y-3">
        <div>
          <label className="text-[11px] font-medium text-zinc-700 block mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="AI/ML Community, Robotics Club, Placement Prep…"
            className="w-full px-3 py-2.5 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-zinc-700 block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] font-medium text-zinc-700 block mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-2.5 py-2 text-xs border border-zinc-300 rounded-xl bg-white">
              {SPACE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 block mb-1">Visibility</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full px-2.5 py-2 text-xs border border-zinc-300 rounded-xl bg-white">
              <option value="public">Public</option>
              <option value="university_only">University only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-zinc-700 block mb-1">Membership</label>
            <select value={membershipMode} onChange={(e) => setMembershipMode(e.target.value)} className="w-full px-2.5 py-2 text-xs border border-zinc-300 rounded-xl bg-white">
              <option value="open">Open</option>
              <option value="request_to_join">Request to join</option>
              <option value="invite_only">Invite only</option>
            </select>
          </div>
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-xs">{error}</div>
        )}
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-xs font-medium">
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!name.trim() || saving}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium disabled:opacity-40"
          >
            {saving ? 'Creating…' : 'Create space'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
