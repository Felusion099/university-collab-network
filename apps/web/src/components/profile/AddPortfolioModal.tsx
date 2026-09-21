import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { PortfolioItem } from '../../types';

export const AddPortfolioModal: React.FC = () => {
  const { isPortfolioAddOpen, setIsPortfolioAddOpen, addPortfolioItem } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PortfolioItem['category']>('Software');
  const [role, setRole] = useState('');
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80'
  );
  const [technologiesStr, setTechnologiesStr] = useState('React, TypeScript, Python');
  const [outcomes, setOutcomes] = useState('');
  const [link, setLink] = useState('');

  const sampleCovers = [
    { label: 'Software / Code', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80' },
    { label: 'Design / UI', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80' },
    { label: 'Hardware / PCB', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80' },
    { label: 'Research / Data', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    addPortfolioItem({
      title: title.trim(),
      description: description.trim(),
      category,
      role: role.trim() || 'Contributor',
      coverImage: coverImage.trim(),
      tags: technologiesStr.split(',').map((t) => t.trim()).filter(Boolean),
      technologies: technologiesStr.split(',').map((t) => t.trim()).filter(Boolean),
      outcomes: outcomes.trim() || undefined,
      link: link.trim() || undefined,
      date: 'Sep 2026',
    });

    setTitle('');
    setDescription('');
    setOutcomes('');
    setLink('');
    setIsPortfolioAddOpen(false);
  };

  return (
    <Modal
      isOpen={isPortfolioAddOpen}
      onClose={() => setIsPortfolioAddOpen(false)}
      title="Add Portfolio Piece"
      subtitle="Showcase your engineering builds, UI designs, hardware prototypes, or scientific research."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Sensor Telemetry Node"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-700 focus:outline-none"
            >
              <option value="Software">Software</option>
              <option value="Design">Design & UI/UX</option>
              <option value="Hardware">Hardware & Robotics</option>
              <option value="Research">Academic Research</option>
              <option value="Writing">Writing & Analysis</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Your Role in the Project</label>
          <input
            type="text"
            required
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Lead Systems Programmer & Firmware Author"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Project Summary & Impact</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what problem it solved, the architecture, and what you learned..."
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Technologies Used (comma-separated)</label>
          <input
            type="text"
            value={technologiesStr}
            onChange={(e) => setTechnologiesStr(e.target.value)}
            placeholder="e.g. Python, ROS2, PyTorch, KiCAD"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Demonstrated Outcomes / Awards (optional)</label>
          <input
            type="text"
            value={outcomes}
            onChange={(e) => setOutcomes(e.target.value)}
            placeholder="e.g. Won 1st place in Hackathon; paper accepted to workshop; 400+ stars on GitHub"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Cover Image Preset / URL</label>
          <div className="flex gap-2 mb-2">
            {sampleCovers.map((c) => (
              <button
                type="button"
                key={c.label}
                onClick={() => setCoverImage(c.url)}
                className={`px-2 py-1 rounded text-[11px] border ${
                  coverImage === c.url ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">External Link / GitHub URL (optional)</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setIsPortfolioAddOpen(false)}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium"
          >
            Publish to Portfolio
          </button>
        </div>
      </form>
    </Modal>
  );
};
