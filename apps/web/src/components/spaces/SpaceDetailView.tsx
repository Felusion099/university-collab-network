import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/api/client';
import { ArrowLeft, Globe, Lock, UserPlus, UserMinus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { SpaceChatPanel } from './SpaceChatPanel';

export interface SpaceDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  visibility: string;
  membershipMode: string;
  linkedProject: { id: string; name: string } | null;
  isOwner: boolean;
  myRole: 'owner' | 'admin' | 'member' | null;
  isMember: boolean;
  conversationId: string | null;
  memberCount: number;
  members: { userId: string; username: string; avatarUrl: string | null; role: string | null; spaceRole: string }[];
}

interface JoinRequest {
  id: string;
  user: { id: string; username: string; avatarUrl: string | null };
  createdAt: string;
}

/** Collaboration Space detail — chat (member-only), members, pending join
 * requests (owner/admin), leave. Owner/admin actions are enforced
 * server-side; the UI only mirrors that. */
export const SpaceDetailView: React.FC<{
  spaceId: string;
  onBack: () => void;
}> = ({ spaceId, onBack }) => {
  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'chat' | 'members'>('chat');
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await apiFetch<SpaceDetail>(`/spaces/${spaceId}`);
      setSpace(res);
      if (res.isMember && (res.myRole === 'owner' || res.myRole === 'admin')) {
        try {
          const r = await apiFetch<{ data: JoinRequest[] }>(`/spaces/${spaceId}/join-requests`);
          setJoinRequests(r.data ?? []);
        } catch {
          setJoinRequests([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load space');
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async () => {
    setActionError(null);
    try {
      const res = await apiFetch<{ joined: boolean; pending: boolean }>(`/spaces/${spaceId}/join`, {
        method: 'POST',
      });
      if (res.pending) setActionError('Request sent — waiting for the owner/admin to approve');
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to join');
    }
  };

  const leave = async () => {
    setActionError(null);
    try {
      await apiFetch(`/spaces/${spaceId}/leave`, { method: 'POST' });
      onBack();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to leave');
    }
  };

  const approve = async (requestId: string) => {
    setActionError(null);
    try {
      await apiFetch(`/spaces/join-requests/${requestId}/approve`, { method: 'PATCH' });
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const reject = async (requestId: string) => {
    setActionError(null);
    try {
      await apiFetch(`/spaces/join-requests/${requestId}/reject`, { method: 'PATCH' });
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  const promote = async (userId: string) => {
    setActionError(null);
    try {
      await apiFetch(`/spaces/${spaceId}/admins`, { method: 'POST', body: { userId } });
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to promote');
    }
  };

  const demote = async (userId: string) => {
    setActionError(null);
    try {
      await apiFetch(`/spaces/${spaceId}/admins/${userId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to demote');
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-zinc-500">Loading space…</div>;
  }
  if (error || !space) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-zinc-500">{error ?? 'Space not found.'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium">
          Back to Spaces
        </button>
      </div>
    );
  }

  const canSeeChat = space.isMember;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Spaces
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-zinc-900">{space.name}</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {space.type.replace('_', ' ')}
              </span>
              {space.visibility === 'public' ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600"><Globe className="w-3 h-3" /> Public</span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-zinc-500"><Lock className="w-3 h-3" /> {space.visibility.replace('_', ' ')}</span>
              )}
            </div>
            {space.description && <p className="text-sm text-zinc-600 mt-1.5">{space.description}</p>}
            {space.linkedProject && (
              <p className="text-[11px] text-zinc-500 mt-1">Linked project: {space.linkedProject.name}</p>
            )}
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> {space.memberCount} members · {space.membershipMode.replace(/_/g, ' ')}
            </p>
          </div>
          <div className="shrink-0">
            {!space.isMember && (
              <button
                onClick={join}
                disabled={space.membershipMode === 'invite_only'}
                className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-40"
              >
                {space.membershipMode === 'invite_only'
                  ? 'Invite-only'
                  : space.membershipMode === 'open'
                    ? 'Join space'
                    : 'Request to join'}
              </button>
            )}
            {space.isMember && !space.isOwner && (
              <button
                onClick={leave}
                className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-colors"
              >
                Leave space
              </button>
            )}
          </div>
        </div>
        {actionError && (
          <div className={`mt-3 rounded-lg px-3.5 py-2.5 text-xs border ${
            actionError.includes('waiting') || actionError.includes('sent')
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {actionError}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-4 mb-4">
        {(['chat', 'members'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {t}
            {t === 'members' && joinRequests.length > 0 ? ` (${joinRequests.length} pending)` : ''}
          </button>
        ))}
      </div>

      {/* Chat */}
      {tab === 'chat' && (
        <div className="bg-white rounded-2xl border border-zinc-200 h-[560px]">
          {canSeeChat && space.conversationId ? (
            <SpaceChatPanel
              spaceId={space.id}
              conversationId={space.conversationId}
              me={{ id: '', role: space.myRole }}
              spaceName={space.name}
            />
          ) : canSeeChat ? (
            <div className="flex items-center justify-center h-full text-xs text-zinc-500">
              Chat is being set up — refresh in a moment.
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-zinc-500 px-8 text-center">
              Join the space to see and send messages.
            </div>
          )}
        </div>
      )}

      {/* Members */}
      {tab === 'members' && (
        <div className="space-y-4">
          {joinRequests.length > 0 && space.myRole !== 'member' && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5">
              <p className="text-sm font-semibold text-zinc-900 mb-3">Pending requests</p>
              <div className="space-y-2">
                {joinRequests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="text-xs text-zinc-700">{r.user.username}</span>
                    <div className="flex gap-2">
                      <button onClick={() => approve(r.id)} className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-[11px] font-medium">
                        Approve
                      </button>
                      <button onClick={() => reject(r.id)} className="px-3 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg text-[11px]">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-sm font-semibold text-zinc-900 mb-3">Members ({space.members.length})</p>
            <div className="space-y-1">
              {space.members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-[11px] font-bold text-zinc-600">
                        {m.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-zinc-900">{m.username}</p>
                      <p className="text-[10px] text-zinc-500 capitalize">{m.spaceRole}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.spaceRole === 'member' && space.myRole === 'owner' && (
                      <button onClick={() => promote(m.userId)} className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg text-[10px] font-medium hover:bg-zinc-50">
                        <ShieldCheck className="w-3 h-3" /> Make admin
                      </button>
                    )}
                    {m.spaceRole === 'admin' && space.myRole === 'owner' && (
                      <button onClick={() => demote(m.userId)} className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-200 text-zinc-600 rounded-lg text-[10px] font-medium hover:bg-zinc-50">
                        <UserMinus className="w-3 h-3" /> Remove admin
                      </button>
                    )}
                    {m.spaceRole === 'member' && (space.myRole === 'owner' || space.myRole === 'admin') && !space.linkedProject && (
                      <button
                        onClick={async () => {
                          setActionError(null);
                          try {
                            await apiFetch(`/spaces/${space.id}/members/remove`, { method: 'POST', body: { userId: m.userId } });
                            load();
                          } catch (err) {
                            setActionError(err instanceof Error ? err.message : 'Failed to remove');
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-zinc-200 text-red-500 rounded-lg text-[10px] font-medium hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
