import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Service } from '../../types';

export const CreateServiceModal: React.FC = () => {
  const { isServiceCreateOpen, setIsServiceCreateOpen, createService } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Service['category']>('Engineering');
  const [turnaround, setTurnaround] = useState('2 to 4 Days');
  const [startingPrice, setStartingPrice] = useState('$80');
  const [skillsStr, setSkillsStr] = useState('TypeScript, React, PostgreSQL');
  const [pkg1Title, setPkg1Title] = useState('Standard Campus Delivery');
  const [pkg1Price, setPkg1Price] = useState('$80');
  const [pkg1FeaturesStr, setPkg1FeaturesStr] = useState('Code walkthrough; Full source code; 1 revision round');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    createService({
      title: title.trim(),
      description: description.trim(),
      category,
      turnaround,
      startingPrice,
      skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      packages: [
        {
          name: pkg1Title,
          deliveryDays: 3,
          price: pkg1Price,
          features: pkg1FeaturesStr.split(';').map((f) => f.trim()).filter(Boolean),
        },
      ],
    });

    setTitle('');
    setDescription('');
    setIsServiceCreateOpen(false);
  };

  return (
    <Modal
      isOpen={isServiceCreateOpen}
      onClose={() => setIsServiceCreateOpen(false)}
      title="Publish Student or Creator Service"
      subtitle="Offer your technical, design, hardware, or research writing skills to campus peers."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-medium text-zinc-700 mb-1">Service Headline</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. I will build an MVP backend or review your PCB schematic"
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
              <option value="Engineering">Engineering</option>
              <option value="Design">Design & UI/UX</option>
              <option value="Hardware & IoT">Hardware & IoT</option>
              <option value="Research & Writing">Research & Writing</option>
              <option value="Multimedia">Multimedia & Video</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Starting Price</label>
            <input
              type="text"
              required
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              placeholder="e.g. $80"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-700 mb-1">Turnaround Time</label>
            <input
              type="text"
              required
              value={turnaround}
              onChange={(e) => setTurnaround(e.target.value)}
              placeholder="e.g. 3 to 5 Days"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Detailed Description of Deliverables</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what tools you use, what files the client receives, and your process..."
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Skills & Tools (comma-separated)</label>
          <input
            type="text"
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            placeholder="e.g. Figma, React, Go, Docker"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Package Definition */}
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
          <div className="font-semibold text-zinc-800">Primary Package Deliverable</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={pkg1Title}
              onChange={(e) => setPkg1Title(e.target.value)}
              placeholder="Package Name"
              className="px-2.5 py-1.5 border border-zinc-200 rounded bg-white"
            />
            <input
              type="text"
              value={pkg1Price}
              onChange={(e) => setPkg1Price(e.target.value)}
              placeholder="Package Price"
              className="px-2.5 py-1.5 border border-zinc-200 rounded bg-white"
            />
          </div>
          <input
            type="text"
            value={pkg1FeaturesStr}
            onChange={(e) => setPkg1FeaturesStr(e.target.value)}
            placeholder="Included features (semicolon-separated)"
            className="w-full px-2.5 py-1.5 border border-zinc-200 rounded bg-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setIsServiceCreateOpen(false)}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium shadow-xs"
          >
            Publish Service
          </button>
        </div>
      </form>
    </Modal>
  );
};
