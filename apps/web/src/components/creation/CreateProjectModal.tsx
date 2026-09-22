import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Project } from '../../types';

export const CreateProjectModal: React.FC = () => {
  const { isProjectCreateOpen, setIsProjectCreateOpen, createProject } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Project['category']>('Hackathon');
  const [collaborationType, setCollaborationType] = useState<Project['collaborationType']>('Hybrid');
  const [visibility, setVisibility] = useState<Project['visibility']>('public');
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
  const [deadline, setDeadline] = useState('October 30, 2026');
  const [rolesStr, setRolesStr] = useState('ML Engineer, UI/UX Designer, Frontend Developer');
  const [skillsStr, setSkillsStr] = useState('Python, React, TypeScript, Figma');
  const [requirementsStr, setRequirementsStr] = useState(
    'Familiar with Git and clean code practices; Available for weekly check-ins'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    createProject({
      title: title.trim(),
      description: description.trim(),
      category,
      status: 'Open',
      collaborationType,
      visibility,
      maxTeamSize: Number(maxTeamSize) || 4,
      deadline,
      requiredRoles: rolesStr.split(',').map((r) => r.trim()).filter(Boolean),
      skillsRequired: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      requirements: requirementsStr.split(';').map((req) => req.trim()).filter(Boolean),
      tags: [category, collaborationType],
    });

    setTitle('');
    setDescription('');
    setIsProjectCreateOpen(false);
  };

  return (
    <Modal
      isOpen={isProjectCreateOpen}
      onClose={() => setIsProjectCreateOpen(false)}
      title="Post a University Project or Hackathon Team"
      subtitle="Recruit peer collaborators, researchers, and creators across campus departments."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-zinc-700 mb-1">Project or Team Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. EcoGrid: Edge IoT Carbon Optimization for Campus Dorms"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-700 focus:outline-none"
            >
              <option value="Hackathon">Hackathon</option>
              <option value="Research">Academic Research</option>
              <option value="Startup">Student Startup</option>
              <option value="Software">Software Engineering</option>
              <option value="Hardware">Hardware & Robotics</option>
              <option value="Design">Product Design</option>
              <option value="Academic">Coursework Project</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Collaboration Mode</label>
            <select
              value={collaborationType}
              onChange={(e) => setCollaborationType(e.target.value as any)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-700 focus:outline-none"
            >
              <option value="Hybrid">Hybrid (Campus + Remote)</option>
              <option value="In-person">In-Person Only</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Project['visibility'])}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-700 focus:outline-none"
            >
              <option value="public">Public — discoverable by everyone</option>
              <option value="private">Private — only you and your team</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Team Target Size</label>
            <input
              type="number"
              min={2}
              max={10}
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(Number(e.target.value))}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Project Summary & Problem Statement</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the vision, what you are aiming to build, and who you need..."
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">
            Open Roles Needed (comma-separated)
          </label>
          <input
            type="text"
            required
            value={rolesStr}
            onChange={(e) => setRolesStr(e.target.value)}
            placeholder="e.g. Backend Go Engineer, UI/UX Designer, Data Analyst"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">
            Required Skills (comma-separated)
          </label>
          <input
            type="text"
            required
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            placeholder="e.g. Python, PyTorch, React, ROS2"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Target Deadline</label>
            <input
              type="text"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="e.g. November 15, 2026"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">
              Key Requirements (semicolon-separated)
            </label>
            <input
              type="text"
              value={requirementsStr}
              onChange={(e) => setRequirementsStr(e.target.value)}
              placeholder="e.g. 5-8 hrs/week; Experience with microcontrollers"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setIsProjectCreateOpen(false)}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium shadow-xs"
          >
            Publish Project Opportunity
          </button>
        </div>
      </form>
    </Modal>
  );
};
