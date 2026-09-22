import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import type { Project } from '../../types';

const PROJECT_CATEGORIES: Project['category'][] = ['Hackathon', 'Research', 'Startup', 'Software', 'Hardware', 'Design', 'Academic'];
const PROJECT_STATUSES: Project['status'][] = ['Open', 'In Progress', 'Completed', 'Draft'];

export const EditProjectModal: React.FC = () => {
  const {
    isProjectEditOpen,
    setIsProjectEditOpen,
    selectedProjectId,
    projects,
    updateProject,
  } = useApp();

  const project = projects.find((p) => p.id === selectedProjectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Project['category']>('Software');
  const [status, setStatus] = useState<Project['status']>('Open');
  const [visibility, setVisibility] = useState<Project['visibility']>('public');
  const [deadline, setDeadline] = useState('');
  const [collaborationType, setCollaborationType] = useState<Project['collaborationType']>('Hybrid');
  const [skillsStr, setSkillsStr] = useState('');
  const [requirementsStr, setRequirementsStr] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Seed the form fields from the project when it opens
  if (isProjectEditOpen && project && !initialized) {
    setTitle(project.title);
    setDescription(project.description);
    setCategory(project.category);
    setStatus(project.status);
    setVisibility(project.visibility);
    setDeadline(project.deadline);
    setCollaborationType(project.collaborationType);
    setSkillsStr(project.skillsRequired.join(', '));
    setRequirementsStr(project.requirements.join('; '));
    setInitialized(true);
  }
  if (!isProjectEditOpen && initialized) setInitialized(false);

  if (!isProjectEditOpen || !project) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    updateProject(project.id, {
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      visibility,
      deadline,
      collaborationType,
      skillsRequired: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      requirements: requirementsStr.split(';').map((r) => r.trim()).filter(Boolean),
    });
    setIsProjectEditOpen(false);
  };

  const inputCls =
    'w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500';

  return (
    <Modal
      isOpen={isProjectEditOpen}
      onClose={() => setIsProjectEditOpen(false)}
      title="Edit Project"
      subtitle="Update your project's details, visibility, and team preferences."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-zinc-700 mb-1">Project Title</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Description</label>
          <textarea rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Project['category'])} className={inputCls}>
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Project['status'])} className={inputCls}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Project['visibility'])}
              className={inputCls}
            >
              <option value="public">Public — discoverable by everyone</option>
              <option value="private">Private — only you and your team</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Collaboration Mode</label>
            <select
              value={collaborationType}
              onChange={(e) => setCollaborationType(e.target.value as Project['collaborationType'])}
              className={inputCls}
            >
              <option value="Hybrid">Hybrid (Campus + Remote)</option>
              <option value="In-person">In-Person Only</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Deadline</label>
            <input type="text" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Required Skills (comma-separated)</label>
            <input type="text" value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Key Requirements (semicolon-separated)</label>
          <input
            type="text"
            value={requirementsStr}
            onChange={(e) => setRequirementsStr(e.target.value)}
            placeholder="Must be enrolled; available weekends"
            className={inputCls}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setIsProjectEditOpen(false)}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium"
          >
            Cancel
          </button>
          <button type="submit" className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium">
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};
