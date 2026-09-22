import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Send, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { VerificationBadge } from '../common/VerificationBadge';

/** Connection request modal — an OPTIONAL short message; the receiver sees
 * who sent it, their profile and the message. The API enforces the
 * 3-requests/week rate limit + one pending request per pair. */
export const ConnectionRequestModal: React.FC = () => {
  const {
    isCollabModalOpen,
    setIsCollabModalOpen,
    collabTargetUser,
    sendConnectionRequest,
    connections,
    currentUser,
  } = useApp();

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!collabTargetUser) return null;

  // One connection per pair (API-enforced): surface the existing state
  // instead of letting the user fire a duplicate that errors.
  const existing = connections.find(
    (c) =>
      (c.requesterId === currentUser.id && c.addresseeId === collabTargetUser.id) ||
      (c.addresseeId === currentUser.id && c.requesterId === collabTargetUser.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    await sendConnectionRequest(collabTargetUser.id, message.trim() || undefined);
    setMessage('');
    setBusy(false);
    setIsCollabModalOpen(false);
  };

  const stateBlock = existing && existing.status !== 'declined'
    ? existing.status === 'pending'
      ? existing.requesterId === currentUser.id
        ? {
            tone: 'amber' as const,
            icon: <Clock className="w-4 h-4 mt-0.5 shrink-0" />,
            text: `Your connection request to ${collabTargetUser.name} is pending. They'll review it soon — you'll be notified when they respond.`,
          }
        : {
            tone: 'emerald' as const,
            icon: <Clock className="w-4 h-4 mt-0.5 shrink-0" />,
            text: `${collabTargetUser.name} has already sent you a connection request. Accept it from your dashboard to connect.`,
          }
      : {
          tone: 'emerald' as const,
          icon: <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />,
          text: `You're already connected with ${collabTargetUser.name}. Head to Messages to continue the conversation.`,
        }
    : null;

  const tones = {
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  return (
    <Modal
      isOpen={isCollabModalOpen}
      onClose={() => setIsCollabModalOpen(false)}
      title="Connect"
      subtitle={`Send a connection request to ${collabTargetUser.name}`}
      maxWidth="md"
    >
      {/* Recipient card preview */}
      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center gap-3 mb-4">
        <img
          src={collabTargetUser.avatar}
          alt={collabTargetUser.name}
          className="w-10 h-10 rounded-full object-cover border border-zinc-200"
        />
        <div className="min-w-0">
          <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
            {collabTargetUser.name}
            <VerificationBadge verification={collabTargetUser.verification} size="sm" />
          </div>
          <div className="text-[11px] text-zinc-500 truncate">{collabTargetUser.headline || collabTargetUser.department}</div>
        </div>
      </div>

      {stateBlock && (
        <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed border ${tones[stateBlock.tone]}`}>
          {stateBlock.icon}
          <span>{stateBlock.text}</span>
        </div>
      )}

      {!stateBlock && (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">
              Short message <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              placeholder={`e.g. I'd like to connect because we're both interested in ${collabTargetUser.skills[0] ?? 'the same field'} and university hackathons.`}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
            <p className="text-[10px] text-zinc-400 mt-1">{message.length}/500 characters</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsCollabModalOpen(false)}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Request</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
