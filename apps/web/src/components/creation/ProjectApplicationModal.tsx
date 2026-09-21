import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Send, Sparkles } from 'lucide-react';

export const ProjectApplicationModal: React.FC = () => {
  const {
    isApplicationModalOpen,
    setIsApplicationModalOpen,
    applicationTargetProject,
    applyToProject,
    currentUser,
  } = useApp();

  const [roleApplied, setRoleApplied] = useState('');
  const [message, setMessage] = useState('');
  const [skillsStr, setSkillsStr] = useState(currentUser.skills.slice(0, 4).join(', '));
  const [portfolioLinksStr, setPortfolioLinksStr] = useState('https://github.com');
  const [timeline, setTimeline] = useState('Available 8-10 hours/week; ready for demo sprint');

  if (!applicationTargetProject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    applyToProject({
      projectId: applicationTargetProject.id,
      roleApplied: roleApplied || applicationTargetProject.requiredRoles[0] || 'Contributor',
      message: message.trim(),
      relevantSkills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      portfolioLinks: portfolioLinksStr.split(',').map((s) => s.trim()).filter(Boolean),
      proposedTimeline: timeline,
    });

    setMessage('');
    setIsApplicationModalOpen(false);
  };

  return (
    <Modal
      isOpen={isApplicationModalOpen}
      onClose={() => setIsApplicationModalOpen(false)}
      title="Submit Collaboration Proposal"
      subtitle={`Apply to join ${applicationTargetProject.title}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-zinc-700 mb-1">Select Role You're Applying For</label>
          <select
            value={roleApplied}
            onChange={(e) => setRoleApplied(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-700 focus:outline-none"
          >
            {applicationTargetProject.requiredRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">
            Collaboration Pitch & How You Can Help
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Introduce your background, relevant past projects, and why this project excites you..."
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">
            Relevant Skills for this Role (comma-separated)
          </label>
          <input
            type="text"
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">
            Portfolio References & Links (comma-separated)
          </label>
          <input
            type="text"
            value={portfolioLinksStr}
            onChange={(e) => setPortfolioLinksStr(e.target.value)}
            placeholder="e.g. https://github.com/my-work, https://my-portfolio.dev"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Proposed Timeline & Commitment</label>
          <input
            type="text"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setIsApplicationModalOpen(false)}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium flex items-center gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Proposal</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
