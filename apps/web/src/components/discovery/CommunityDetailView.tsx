import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/VerificationBadge';
import { apiFetch } from '../../services/api/client';
import {
  ArrowLeft,
  UserMinus,
  UserPlus,
  Crown,
  ShieldCheck,
  Users,
  CalendarDays,
  Crown as CrownIcon,
} from 'lucide-react';

const ROLE_OPTIONS = [
  { role: 'leader', label: 'Vice President', rank: 90 },
  { role: 'advisor', label: 'Department Head', rank: 80 },
  { role: 'member', label: 'Member', rank: 10 },
];

/** Community detail experience — a joined community opens a real page:
 * info, leadership (rank-enforced roles), members, upcoming events.
 * Role management is server-authorized (Discord-like hierarchy). */
export const CommunityDetailView: React.FC = () => {
  const {
    selectedCommunityId,
    setSelectedCommunityId,
    communities,
    users,
    currentUser,
    events,
    showToast,
    openUserProfile,
  } = useApp();

  const community = communities.find((c) => c.id === selectedCommunityId);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [assignRole, setAssignRole] = useState('member');
  const [assignTitle, setAssignTitle] = useState('');
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!community) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-zinc-500">Community not found.</p>
        <button
          onClick={() => setSelectedCommunityId(null)}
          className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium"
        >
          Back to Communities
        </button>
      </div>
    );
  }

  // Leadership + rank (the enum role: founder=100/owner, leader=90, advisor=80, member=10)
  const myMembership = community.members.includes(currentUser.id) ? community : null;
  const myRole = myMembership && community.leads.includes(currentUser.id)
    ? (community.members.length > 0 && community.id ? 'leader' : 'member')
    : 'member';
  // The rank map mirrors the backend's ROLE_RANKS
  const rankOf = (userId: string): number => {
    if (userId === community.leads[0]) return 100; // creator/president
    if (community.leads.includes(userId)) return 90;
    return 10;
  };
  const myRank = community.members.includes(currentUser.id) ? rankOf(currentUser.id) : 0;
  const isPresident = myRank >= 100;

  const memberRows = community.members.map((id) => ({
    id,
    user: users.find((u) => u.id === id),
    rank: rankOf(id),
  })).filter((r) => r.user);

  const canManage = myRank >= 80;

  const handleAssign = async (targetUserId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch(`/organizations/${community.id}/members/${targetUserId}`, {
        method: 'PATCH',
        body: { role: assignRole, roleTitle: assignTitle.trim() },
      });
      showToast('Role updated.');
      setAssignOpen(null);
      setAssignTitle('');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Could not update the role.';
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (targetUserId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch(`/organizations/${community.id}/members/${targetUserId}`, { method: 'DELETE' });
      showToast('Member removed.');
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Could not remove the member.';
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleTransfer = async (targetUserId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch(`/organizations/${community.id}/transfer-ownership`, {
        method: 'POST',
        body: { userId: targetUserId },
      });
      showToast('Presidency transferred.');
      setTransferTarget(null);
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Could not transfer presidency.';
      showToast(msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  const upcomingEvents = events.filter((e) => e.organizer === community.name).slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in-up">
      {/* Back */}
      <button
        onClick={() => setSelectedCommunityId(null)}
        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Communities
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="p-6 sm:p-8 -mt-10">
          <div className="flex items-start gap-4">
            <img src={community.logo} alt="" className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow" />
            <div className="min-w-0 flex-1 pt-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{community.name}</h1>
                <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
                  {community.category}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{community.handle} · {community.memberCount} members</p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 leading-relaxed mt-4">{community.description}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        {/* Members + roles */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-zinc-900">Members & Leadership ({community.memberCount})</h3>
              {isPresident && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  <Crown className="w-3 h-3" />
                  You are President
                </span>
              )}
            </div>
            <div className="space-y-3">
              {memberRows.map(({ id, user, rank }) => {
                if (!user) return null;
                const isOwnerRow = rank >= 100;
                const isLeaderRow = rank >= 90 && rank < 100;
                const title = community.leads.includes(id) ? (isOwnerRow ? 'President' : 'Vice President') : 'Member';
                const canEditThis = canManage && myRank > rank;
                const canRemoveThis = canManage && myRank > rank;
                return (
                  <div key={id} className="flex items-start gap-3">
                    <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-zinc-200" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          onClick={() => {
                            setSelectedCommunityId(null);
                            openUserProfile(user!.id);
                          }}
                          className="font-medium text-xs truncate hover:underline cursor-pointer"
                        >
                          {user.name}
                        </span>
                        <VerificationBadge verification={user.verification} size="sm" />
                        {isOwnerRow && <Crown className="w-3 h-3 text-amber-500" />}
                      </div>
                      <span className="text-[10px] text-zinc-500">{title}</span>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        {canEditThis && (
                          <button
                            onClick={() => {
                              setAssignOpen(id);
                              setAssignRole(rank >= 90 ? 'member' : 'leader');
                            }}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition"
                            title="Change role"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canRemoveThis && (
                          <button
                            onClick={() => handleRemove(id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Remove from community"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Assign role inline form */}
            {assignOpen && (
              <div className="mt-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
                <h4 className="text-xs font-bold text-zinc-900">Change role</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.role} value={o.role}>{o.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    placeholder="Custom role title (e.g. PR Head)"
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAssign(assignOpen)}
                    disabled={busy}
                    className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold disabled:opacity-60"
                  >
                    Save role
                  </button>
                  <button onClick={() => setAssignOpen(null)} className="px-3 py-1.5 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Ownership transfer (president only) */}
            {isPresident && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-900 mb-2">Transfer presidency</h4>
                {transferTarget ? (
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="text-xs text-amber-800">
                      Transfer the highest authority to this member? They become President; you step down to Vice President.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleTransfer(transferTarget)}
                        disabled={busy}
                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold disabled:opacity-60"
                      >
                        Confirm transfer
                      </button>
                      <button onClick={() => setTransferTarget(null)} className="px-3 py-1.5 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {memberRows.filter((r) => r.rank < 100 && r.id !== currentUser.id).map(({ id, user }) => (
                      <button
                        key={id}
                        onClick={() => setTransferTarget(id)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 transition"
                      >
                        <UserPlus className="w-3 h-3" />
                        {user!.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: events */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="font-bold text-sm text-zinc-900 mb-3 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-zinc-400" />
              Community events
            </h3>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-zinc-400">No community events yet.</p>
              ) : (
                upcomingEvents.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50">
                    <h4 className="font-bold text-xs text-zinc-900">{ev.title}</h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{ev.date} · {ev.venue}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 p-6 mt-5">
            <h3 className="font-bold text-sm text-zinc-900 mb-2 flex items-center gap-1.5">
              <CrownIcon className="w-4 h-4 text-zinc-400" />
              About this community
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {community.description || 'A campus community within the university network.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
