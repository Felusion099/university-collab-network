import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch } from '../../services/api/client';
import {
  ShieldCheck,
  Users,
  FolderKanban,
  Building2,
  CalendarDays,
  Rocket,
  Megaphone,
  Loader2,
  Trash2,
} from 'lucide-react';

interface Metrics {
  totalUsers: number;
  totalProjects: number;
  collaborationsFormed: number;
}

interface Row {
  id: string;
  [key: string]: unknown;
}

/** Admin Panel — uses the EXISTING admin authorization (requestedRole +
 * approved verifications, server-enforced). Dedicated management surface:
 * metrics, users, notices, communities/clubs, events, startups. */
export const AdminPanelView: React.FC = () => {
  const { showToast } = useApp();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'notices' | 'users' | 'communities' | 'events' | 'startups'>('notices');
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const m = await apiFetch<Metrics>('/admin/metrics');
        setMetrics(m);
      } catch {
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const endpoints: Record<string, string> = {
        notices: '/notices?limit=50',
        users: '/users?limit=50',
        communities: '/organizations?type=club&limit=50',
        events: '/events?limit=50',
        startups: '/organizations?type=startup&limit=50',
      };
      try {
        const res = await apiFetch<{ data?: Row[] }>(endpoints[tab]);
        if (!cancelled) setRows(res.data ?? []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const deleteRow = async (id: string) => {
    const path =
      tab === 'notices' ? `/notices/${id}` : tab === 'events' ? `/events/${id}` : tab === 'startups' || tab === 'communities' ? `/organizations/${id}` : null;
    if (!path) {
      showToast('Users cannot be deleted from here.', 'error');
      return;
    }
    try {
      await apiFetch(path, { method: 'DELETE' });
      setRows((prev) => prev.filter((r) => r.id !== id));
      showToast('Deleted.');
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Could not delete.';
      showToast(msg, 'error');
    }
  };

  const renderRow = (row: Row) => {
    if (tab === 'notices') {
      return (
        <div key={row.id} className="p-4 bg-white rounded-xl border border-zinc-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {String(row.priority ?? 'Notice')}
              </span>
              <h4 className="font-bold text-xs text-zinc-900 truncate">{String(row.title)}</h4>
            </div>
            <p className="text-[11px] text-zinc-600 mt-1 line-clamp-2">{String(row.content ?? '')}</p>
          </div>
          <button onClick={() => deleteRow(row.id)} className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
    if (tab === 'users') {
      return (
        <div key={row.id} className="p-4 bg-white rounded-xl border border-zinc-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {row.avatarUrl ? (
              <img src={String(row.avatarUrl)} alt="" className="w-8 h-8 rounded-full object-cover border border-zinc-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-200" />
            )}
            <div className="min-w-0">
              <div className="font-medium text-xs text-zinc-900 truncate">@{String(row.username)}</div>
              <div className="text-[11px] text-zinc-500 capitalize">{String(row.requestedRole)}</div>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 capitalize shrink-0">
            {String(row.status)}
          </span>
        </div>
      );
    }
    // communities / events / startups
    const title = String(row.name ?? row.title ?? '');
    const sub = String(row.category ?? (row.startupDetails as Record<string, unknown> | undefined)?.industry ?? row.venue ?? '');
    return (
      <div key={row.id} className="p-4 bg-white rounded-xl border border-zinc-200 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h4 className="font-bold text-xs text-zinc-900 truncate">{title}</h4>
          <p className="text-[11px] text-zinc-500 truncate">{sub}</p>
        </div>
        <button onClick={() => deleteRow(row.id)} className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page identity header */}
      <div className="pb-6 border-b border-zinc-200">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-purple-700" />
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Admin Panel</h2>
        </div>
        <p className="text-sm text-zinc-600 mt-1">
          Platform management — content curation, users, and moderation. Access is verified server-side.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {[
          { icon: Users, label: 'Total Users', value: metrics?.totalUsers },
          { icon: FolderKanban, label: 'Projects', value: metrics?.totalProjects },
          { icon: Rocket, label: 'Collaborations', value: metrics?.collaborationsFormed },
          { icon: Megaphone, label: 'Notices', value: tab === 'notices' ? rows.length : undefined },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="p-5 bg-white rounded-xl border border-zinc-200 shadow-xs">
            <Icon className="w-4 h-4 text-zinc-400 mb-2" />
            <div className="text-2xl font-bold text-zinc-900 mt-1">{loading ? '…' : (value ?? '—')}</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Management tabs */}
      <div className="flex items-center gap-2 mt-8 border-b border-zinc-200 pb-3 text-xs font-medium overflow-x-auto">
        {[
          { id: 'notices', label: 'Notices', icon: Megaphone },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'communities', label: 'Communities & Clubs', icon: Building2 },
          { id: 'events', label: 'Events', icon: CalendarDays },
          { id: 'startups', label: 'Startups', icon: Rocket },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              tab === t.id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Rows */}
      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="p-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 text-center">
            Nothing here yet.
          </div>
        ) : (
          rows.map(renderRow)
        )}
      </div>
    </div>
  );
};
