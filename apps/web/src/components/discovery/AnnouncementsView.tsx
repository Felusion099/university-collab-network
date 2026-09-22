import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { liveCreateNotice } from '../../services/api/live';
import { Building2, Pin, AlertCircle, Plus, Send, CheckCircle2, Trash2 } from 'lucide-react';

export const AnnouncementsView: React.FC = () => {
  const { announcements, currentUser, createAnnouncement, setActiveTab, showToast, mode } = useApp();
  const [isPublishing, setIsPublishing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Urgent' | 'Important' | 'Notice'>('Important');
  const [publishedToast, setPublishedToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (mode === 'live') {
      // Notices persist in the backend (admin-authored, server-verified)
      liveCreateNotice({ title: title.trim(), content: content.trim(), priority })
        .then(() => {
          setTitle('');
          setContent('');
          setIsPublishing(false);
          showToast('Notice published.');
          setTimeout(() => window.location.reload(), 800);
        })
        .catch((err) => {
          const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Could not publish the notice.';
          showToast(msg, 'error');
        });
      return;
    }
    createAnnouncement({ title: title.trim(), content: content.trim(), priority });
    setTitle('');
    setContent('');
    setIsPublishing(false);
    setPublishedToast(true);
    setTimeout(() => setPublishedToast(false), 3000);
  };

  const isCouncil = currentUser.role === 'council_admin';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-zinc-900" />
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
              University Council Announcements & Grants
            </h2>
          </div>
          <p className="text-sm text-zinc-600 mt-1">
            Official academic affairs bulletins, research funding calls, and campus makerspace access updates.
          </p>
        </div>

        {isCouncil && (
          <button
            onClick={() => setIsPublishing(!isPublishing)}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* Publish Toast */}
      {publishedToast && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Council announcement published and broadcasted to campus network.</span>
        </div>
      )}

      {/* Council Admin Publishing Form */}
      {isCouncil && isPublishing && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 p-6 bg-purple-50/40 rounded-2xl border border-purple-200/80 space-y-4 text-xs"
        >
          <div className="font-semibold text-sm text-purple-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-purple-700" />
            <span>Publish Official University Bulletin</span>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Notice Title / Grant Header</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Winter 2026 Student Venture Grant Call ($10,000)"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Priority Level</label>
            <div className="flex gap-2">
              {(['Urgent', 'Important', 'Notice'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium border ${
                    priority === p
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Content & Guidelines</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detail eligibility, deadlines, lab hours, or links..."
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPublishing(false)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-medium flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Notice</span>
            </button>
          </div>
        </form>
      )}

      {/* Announcements Stream */}
      <div className="mt-6 space-y-4">
        {announcements.map((ann) => {
          const isUrgent = ann.priority === 'Urgent';
          const isImportant = ann.priority === 'Important';

          return (
            <div
              key={ann.id}
              className={`p-6 rounded-2xl border transition-all ${
                ann.isPinned
                  ? 'bg-amber-50/20 border-amber-200/80 shadow-xs'
                  : 'bg-white border-zinc-200/90 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs mb-2">
                <div className="flex items-center gap-2">
                  {ann.isPinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
                      <Pin className="w-3 h-3 text-amber-700" />
                      Pinned Announcement
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isUrgent
                        ? 'bg-rose-100 text-rose-800'
                        : isImportant
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {ann.priority}
                  </span>
                </div>

                <span className="text-zinc-400 text-xs">{ann.date}</span>
              </div>

              <h3 className="text-base font-bold text-zinc-900">{ann.title}</h3>

              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                <span>By <strong>{ann.author}</strong></span>
                <span>·</span>
                <span>{ann.authorRole}</span>
                <span>·</span>
                <span>{ann.department}</span>
              </div>

              <p className="text-xs text-zinc-700 mt-3 leading-relaxed">
                {ann.content}
              </p>

              {ann.linkAction && (
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-zinc-900 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{ann.linkAction}</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
