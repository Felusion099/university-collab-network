import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AvailabilityStatus } from '../../types';

export const EditProfileModal: React.FC = () => {
  const { currentUser, isProfileEditOpen, setIsProfileEditOpen, updateUserProfile } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [headline, setHeadline] = useState(currentUser.headline);
  const [bio, setBio] = useState(currentUser.bio);
  const [department, setDepartment] = useState(currentUser.department);
  const [yearOrTitle, setYearOrTitle] = useState(currentUser.yearOrTitle);
  const [availability, setAvailability] = useState<AvailabilityStatus>(currentUser.availability);
  const [availabilityLabel, setAvailabilityLabel] = useState(currentUser.availabilityLabel);
  const [skillsStr, setSkillsStr] = useState(currentUser.skills.join(', '));
  const [interestsStr, setInterestsStr] = useState(currentUser.collaborationInterests.join(', '));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      headline,
      bio,
      department,
      yearOrTitle,
      availability,
      availabilityLabel,
      skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      collaborationInterests: interestsStr.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setIsProfileEditOpen(false);
  };

  return (
    <Modal
      isOpen={isProfileEditOpen}
      onClose={() => setIsProfileEditOpen(false)}
      title="Edit Campus Profile"
      subtitle="Update your university credentials, headline, skills, and availability status."
      maxWidth="xl"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Department / Faculty</label>
            <input
              type="text"
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Year or Faculty Title</label>
          <input
            type="text"
            required
            value={yearOrTitle}
            onChange={(e) => setYearOrTitle(e.target.value)}
            placeholder="e.g. Senior · Class of 2026 or Associate Professor"
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Professional Headline</label>
          <input
            type="text"
            required
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Bio / About</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Availability Status</label>
            <select
              value={availability}
              onChange={(e) => {
                const val = e.target.value as AvailabilityStatus;
                setAvailability(val);
                if (val === 'available') setAvailabilityLabel('Open to Hackathons & Teams');
                else if (val === 'selective') setAvailabilityLabel('Selective Collaborations');
                else setAvailabilityLabel('Busy with exams/paper deadlines');
              }}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs bg-white text-zinc-700 focus:outline-none"
            >
              <option value="available">Available (Open to Teams)</option>
              <option value="selective">Selective</option>
              <option value="busy">Busy</option>
            </select>
          </div>
          <div>
            <label className="block font-medium text-zinc-700 mb-1">Status Tagline</label>
            <input
              type="text"
              value={availabilityLabel}
              onChange={(e) => setAvailabilityLabel(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Skills (comma-separated)</label>
          <input
            type="text"
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="block font-medium text-zinc-700 mb-1">Collaboration Interests (comma-separated)</label>
          <input
            type="text"
            value={interestsStr}
            onChange={(e) => setInterestsStr(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => setIsProfileEditOpen(false)}
            className="px-4 py-2 border border-zinc-200 rounded-lg text-zinc-700 hover:bg-zinc-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium"
          >
            Save Profile
          </button>
        </div>
      </form>
    </Modal>
  );
};
