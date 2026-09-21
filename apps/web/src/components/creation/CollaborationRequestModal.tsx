import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Sparkles, Send, Clock, CheckCircle2 } from 'lucide-react';
import { VerificationBadge } from '../common/VerificationBadge';

export const CollaborationRequestModal: React.FC = () => {
  const {
    isCollabModalOpen,
    setIsCollabModalOpen,
    collabTargetUser,
    sendCollaborationRequest,
    collabRequests,
    currentUser,
  } = useApp();

  const [type, setType] = useState<'hackathon' | 'research' | 'project' | 'mentorship'>('hackathon');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  if (!collabTargetUser) return null;

  // One connection per pair (API-enforced): surface an existing request's
  // state instead of letting the user fire a duplicate that 409s.
  const existing = collabRequests.find(
    (r) =>
      (r.senderId === currentUser.id && r.receiverId === collabTargetUser.id) ||
      (r.receiverId === currentUser.id && r.senderId === collabTargetUser.id),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    sendCollaborationRequest({
      receiverId: collabTargetUser.id,
      type,
      title: title.trim(),
      message: message.trim(),
    });

    setTitle('');
    setMessage('');
    setIsCollabModalOpen(false);
  };

  return (
    <Modal
      isOpen={isCollabModalOpen}
      onClose={() => setIsCollabModalOpen(false)}
      title="Send Collaboration Request"
      subtitle={`Invite ${collabTargetUser.name} to build together`}
      maxWidth="lg"
    >
      {existing && existing.status !== 'Declined' && (
        <div
          className={`mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-relaxed border ${
            existing.status === 'Pending'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {existing.status === 'Pending' ? (
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>
            {existing.status === 'Pending'
              ? `You already have a pending collaboration request with ${collabTargetUser.name}. They'll review it soon — you'll be notified when they respond.`
              : `You're already connected with ${collabTargetUser.name}. Head to Messages to continue the conversation.`}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 text-xs ${existing && existing.status !== 'Declined' ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Recipient card preview */}
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center gap-3">
          <img
            src={collabTargetUser.avatar}
            alt={collabTargetUser.name}
            className="w-10 h-10 rounded-full object-cover border border-zinc-200"
          />
          <div>
            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
              {collabTargetUser.name}
              <VerificationBadge verification={collabTargetUser.verification} size="sm" />
            </div>
            <div className="text-[11px] text-zinc-500">{collabTargetUser.headline}</div>
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Collaboration Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'hackathon', label: 'Hackathon Team' },
              { id: 'research', label: 'Research Paper' },
              { id: 'project', label: 'Coursework / MVP' },
              { id: 'mentorship', label: 'Lab Mentorship' },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setType(t.id as any)}
                className={`p-2 rounded-lg border text-center font-medium transition-colors ${
                  type === t.id
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Invitation Subject / Project Name</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Assistive Robotics Hackathon Sprint or Graph AI Workshop"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Invitation Message</label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain what you are building, why you'd love to collaborate with them, and what role they would take..."
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
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
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Collaboration Request</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
