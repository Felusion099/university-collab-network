import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SkillBadge } from '../common/SkillBadge';
import { VerificationBadge } from '../common/VerificationBadge';
import {
  ArrowLeft,
  UserMinus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  Users,
  CalendarDays,
  MapPin,
} from 'lucide-react';

/** Full project detail view — "Clicking View Project navigates to a real
 * project detail page" (profile + discovery + saved all route here via
 * openProjectDetails). Actions are role-aware: the owner manages
 * (edit/delete/visibility/remove teammate), members leave, pending shows
 * state, non-members apply. Rendered as the main view, not a popup. */
export const ProjectDetailView: React.FC = () => {
  const {
    selectedProjectId,
    setSelectedProjectId,
    currentUser,
    users,
    projects,
    applications,
    setIsApplicationModalOpen,
    setApplicationTargetProject,
    setIsProjectEditOpen,
    leaveProject,
    removeProjectMember,
    deleteProject,
    startConversationWithUser,
    openUserProfile,
  } = useApp();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const project = projects.find((p) => p.id === selectedProjectId);

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-zinc-500">Project not found or no longer visible to you.</p>
        <button
          onClick={() => setSelectedProjectId(null)}
          className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const owner = users.find((u) => u.id === project.ownerId);
  const isOwner = project.ownerId === currentUser.id;
  const isMember = project.currentTeam.some((m) => m.userId === currentUser.id);
  const hasPending = applications.some(
    (a) => a.projectId === project.id && a.applicantId === currentUser.id,
  );
  const teamProgress = Math.min(
    100,
    Math.round((project.currentTeam.length / Math.max(1, project.maxTeamSize)) * 100),
  );

  const handleApply = () => {
    setApplicationTargetProject(project);
    setIsApplicationModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in-up">
      {/* Back + owner controls */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setSelectedProjectId(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProjectEditOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-800 text-xs font-medium hover:bg-zinc-50 transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Project
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 text-xs font-medium hover:bg-red-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
          <h4 className="text-sm font-bold text-red-800">Delete this project?</h4>
          <p className="text-xs text-red-700 mt-1 leading-relaxed">
            "{project.title}" will be deactivated through the backend and removed from discovery.
            This cannot be undone.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                deleteProject(project.id);
                setSelectedProjectId(null);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
            >
              Yes, delete project
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2 border border-red-200 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Leave confirmation */}
      {confirmLeave && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-bold text-amber-800">Leave this project?</h4>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            You will be removed from the team — the project itself stays intact with its other members.
            You can request to join again later.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => {
                leaveProject(project.id);
                setConfirmLeave(false);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
            >
              Yes, leave project
            </button>
            <button
              onClick={() => setConfirmLeave(false)}
              className="px-4 py-2 border border-amber-200 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-white">
            {project.category}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
            {project.status}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
            {project.collaborationType}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
            {project.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {project.visibility === 'private' ? 'Private' : 'Public'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">{project.title}</h1>
        <p className="text-sm text-zinc-600 leading-relaxed mt-3">{project.description}</p>

        <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Deadline: {project.deadline || 'Rolling'}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {project.currentTeam.length} / {project.maxTeamSize} team members
          </span>
        </div>

        {/* Team occupancy */}
        <div className="mt-4">
          <div className="h-1.5 rounded-full bg-zinc-100 overflow-hidden">
            <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${teamProgress}%` }} />
          </div>
        </div>

        {/* Actions — role-aware */}
        <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-wrap items-center gap-2">
          {isOwner ? (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg font-medium border border-zinc-200">
              <Pencil className="w-3.5 h-3.5" />
              You own this project
            </span>
          ) : isMember ? (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-lg font-medium border border-indigo-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              You're on this team
            </span>
          ) : hasPending ? (
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-50 text-amber-800 rounded-lg font-medium border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Collaboration request pending — the owner will review it
            </span>
          ) : project.status !== 'Completed' ? (
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold"
            >
              Apply / Collaborate
            </button>
          ) : (
            <span className="text-xs text-zinc-500">This project is completed.</span>
          )}

          {isMember && !isOwner && (
            <button
              onClick={() => setConfirmLeave(true)}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white text-red-600 text-xs font-medium hover:bg-red-50 transition"
            >
              <UserMinus className="w-3.5 h-3.5" />
              Leave Project
            </button>
          )}
          {!isMember && owner && owner.id !== currentUser.id && (
            <button
              onClick={() => startConversationWithUser(owner.id)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition"
            >
              Message owner
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        {/* Left: details */}
        <div className="lg:col-span-3 space-y-5">
          {project.requiredRoles.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h3 className="font-bold text-sm text-zinc-900 mb-3">Open Roles</h3>
              <div className="flex flex-wrap gap-2">
                {project.requiredRoles.map((role, i) => (
                  <span key={`${role}-${i}`} className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {project.requirements.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h3 className="font-bold text-sm text-zinc-900 mb-3">Key Requirements</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-600">
                {project.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {project.skillsRequired.length > 0 && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h3 className="font-bold text-sm text-zinc-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {project.skillsRequired.map((skill, i) => (
                  <SkillBadge key={`${skill}-${i}`} skill={skill} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: owner + team */}
        <div className="lg:col-span-2 space-y-5">
          {owner && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6">
              <h3 className="font-bold text-sm text-zinc-900 mb-3">Project Owner</h3>
              <div className="flex items-start gap-3">
                <img src={owner.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-zinc-200" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={() => {
                        setSelectedProjectId(null);
                        openUserProfile(owner.id);
                      }}
                      className="font-semibold text-sm truncate hover:underline cursor-pointer"
                    >
                      {owner.name}
                    </span>
                    <VerificationBadge verification={owner.verification} size="sm" />
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate">{owner.headline || owner.department}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="font-bold text-sm text-zinc-900 mb-3">Teammates ({project.currentTeam.length})</h3>
            <div className="space-y-3">
              {project.currentTeam.map((m) => {
                const member = users.find((u) => u.id === m.userId);
                if (!member) return null;
                const memberIsOwner = m.userId === project.ownerId;
                return (
                  <div key={m.userId} className="flex items-start gap-3">
                    <img src={member.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-zinc-200" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          onClick={() => {
                            setSelectedProjectId(null);
                            openUserProfile(member.id);
                          }}
                          className="font-medium text-xs truncate hover:underline cursor-pointer"
                        >
                          {member.name}
                        </span>
                        <VerificationBadge verification={member.verification} size="sm" />
                      </div>
                      <span className="text-[10px] text-zinc-500">{m.role || 'Member'}{memberIsOwner ? ' · Owner' : ''}</span>
                    </div>
                    {isOwner && !memberIsOwner && (
                      <button
                        onClick={() => removeProjectMember(project.id, m.userId)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Remove from team"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {project.currentTeam.length === 0 && (
                <p className="text-xs text-zinc-400">No teammates yet — the owner reviews requests.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
