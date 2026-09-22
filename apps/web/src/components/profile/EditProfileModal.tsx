import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AvailabilityStatus } from '../../types';
import { Camera } from 'lucide-react';
import { fileToAvatarDataUrl } from '../../lib/imageResize';

export const EditProfileModal: React.FC = () => {
  const { currentUser, isProfileEditOpen, setIsProfileEditOpen, updateUserProfile, showToast } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [headline, setHeadline] = useState(currentUser.headline);
  const [bio, setBio] = useState(currentUser.bio);
  const [department, setDepartment] = useState(currentUser.department);
  const [yearOrTitle, setYearOrTitle] = useState(currentUser.yearOrTitle);
  const [availability, setAvailability] = useState<AvailabilityStatus>(currentUser.availability);
  const [availabilityLabel, setAvailabilityLabel] = useState(currentUser.availabilityLabel);
  const [skillsStr, setSkillsStr] = useState(currentUser.skills.join(', '));
  const [interestsStr, setInterestsStr] = useState(currentUser.collaborationInterests.join(', '));
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarPreview(dataUrl);
    } catch (err) {
      setAvatarError(err && typeof err === 'object' && 'message' in err ? (err as Error).message : 'Could not process the image.');
    } finally {
      setAvatarBusy(false);
    }
  };

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
      ...(avatarPreview ? { avatar: avatarPreview } : {}),
    });
    setIsProfileEditOpen(false);
  };

  const shownAvatar = avatarPreview ?? currentUser.avatar;

  return (
    <Modal
      isOpen={isProfileEditOpen}
      onClose={() => setIsProfileEditOpen(false)}
      title="Edit Campus Profile"
      subtitle="Update your university credentials, headline, skills, and availability status."
      maxWidth="xl"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Profile picture */}
        <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
          <div className="relative shrink-0">
            {shownAvatar ? (
              <img
                src={shownAvatar}
                alt={name}
                className="w-16 h-16 rounded-full object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-lg">
                {name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U'}
              </div>
            )}
            {avatarBusy && (
              <div className="absolute inset-0 rounded-full bg-zinc-900/50 flex items-center justify-center text-white text-[10px]">…</div>
            )}
          </div>
          <div className="min-w-0">
            <label className="block font-medium text-zinc-700 mb-1">Profile Picture</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 font-medium transition-colors disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                {currentUser.avatar || avatarPreview ? 'Change picture' : 'Upload picture'}
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => setAvatarPreview(null)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900"
                >
                  Undo
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5">JPG, PNG, WebP or GIF · under 5 MB · cropped to a square</p>
            {avatarError && (
              <div className="mt-2 rounded-lg px-2.5 py-1.5 text-[11px] bg-red-50 text-red-700 border border-red-200">
                {avatarError}
              </div>
            )}
          </div>
        </div>

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
