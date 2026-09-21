import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SkillBadge } from '../common/SkillBadge';
import { VerificationBadge } from '../common/VerificationBadge';
import {
  Briefcase,
  Search,
  Calendar,
  Users,
  MapPin,
  Bookmark,
  Sparkles,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Project } from '../../types';

export const ProjectDiscovery: React.FC = () => {
  const {
    projects,
    users,
    currentUser,
    applications,
    openUserProfile,
    setApplicationTargetProject,
    setIsApplicationModalOpen,
    setIsProjectCreateOpen,
    toggleSaveItem,
    isItemSaved,
    globalSearch,
    setGlobalSearch,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollabType, setSelectedCollabType] = useState<string>('all');
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  const categories = ['all', 'Hackathon', 'Research', 'Startup', 'Software', 'Hardware', 'Design'];

  const filteredProjects = projects.filter((p) => {
    // Search
    const term = globalSearch.toLowerCase().trim();
    if (term) {
      const matchTitle = p.title.toLowerCase().includes(term);
      const matchDesc = p.description.toLowerCase().includes(term);
      const matchSkills = p.skillsRequired.some((s) => s.toLowerCase().includes(term));
      const matchRoles = p.requiredRoles.some((r) => r.toLowerCase().includes(term));
      if (!matchTitle && !matchDesc && !matchSkills && !matchRoles) {
        return false;
      }
    }

    // Category
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }

    // Collab type
    if (selectedCollabType !== 'all' && p.collaborationType !== selectedCollabType) {
      return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Projects, Hackathons & Research Teams
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            Find teams actively recruiting student developers, researchers, designers, and creators.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            <strong className="text-zinc-900">{filteredProjects.length}</strong> active opportunities
          </span>
          <button
            onClick={() => setIsProjectCreateOpen(true)}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Post a Project
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="py-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search projects, skills, or open roles..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs capitalize font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/80'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Collaboration Type */}
        <select
          value={selectedCollabType}
          onChange={(e) => setSelectedCollabType(e.target.value)}
          className="text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5 bg-white text-zinc-700 focus:outline-none ml-auto"
        >
          <option value="all">Any Collaboration Type</option>
          <option value="Hybrid">Hybrid</option>
          <option value="In-person">In-person</option>
          <option value="Remote">Remote</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 rounded-2xl border border-zinc-200 mt-4">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 mt-3">No matching projects found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or start a new project to recruit collaborators!
          </p>
          <button
            onClick={() => {
              setGlobalSearch('');
              setSelectedCategory('all');
              setSelectedCollabType('all');
            }}
            className="mt-4 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {filteredProjects.map((project) => {
            const owner = users.find((u) => u.id === project.ownerId) || users[0];
            const isSaved = isItemSaved('project', project.id);
            const isOwner = project.ownerId === currentUser.id;
            const hasApplied = applications.some(
              (a) => a.projectId === project.id && a.applicantId === currentUser.id
            );

            const teamProgressPercent = Math.min(
              100,
              Math.round((project.currentTeam.length / project.maxTeamSize) * 100)
            );

            return (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-zinc-200/90 hover:border-zinc-300 hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Category, Collab Type, Save */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-white">
                        {project.category}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60 font-medium">
                        {project.collaborationType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Deadline: {project.deadline}
                      </span>
                      <button
                        onClick={() => toggleSaveItem('project', project.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isSaved
                            ? 'border-blue-200 bg-blue-50 text-blue-600'
                            : 'border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                        }`}
                        title={isSaved ? 'Saved to bookmarks' : 'Save project'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setDetailProject(project)}
                    className="text-base font-bold text-zinc-900 mt-3 cursor-pointer hover:underline"
                  >
                    {project.title}
                  </h3>

                  {/* Owner Info */}
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={owner.avatar}
                      alt={owner.name}
                      className="w-6 h-6 rounded-full object-cover border border-zinc-200"
                    />
                    <span
                      onClick={() => openUserProfile(owner.id)}
                      className="text-xs text-zinc-700 hover:underline cursor-pointer font-medium"
                    >
                      {owner.name}
                    </span>
                    <VerificationBadge verification={owner.verification} size="sm" />
                    <span className="text-zinc-400 text-xs">·</span>
                    <span className="text-xs text-zinc-500">{owner.department}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-600 mt-3 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Open Roles Required */}
                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Open Roles Needed:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {project.requiredRoles.map((role, i) => (
                        <span
                          key={`${role}-${i}`}
                          className="px-2.5 py-1 rounded-md bg-blue-50/70 border border-blue-200/70 text-blue-800 text-xs font-medium"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skills Required */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.skillsRequired.map((skill) => (
                      <SkillBadge key={skill} skill={skill} size="xs" />
                    ))}
                  </div>

                  {/* Team Occupancy Progress */}
                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>
                          Team: <strong className="text-zinc-900">{project.currentTeam.length}</strong> of {project.maxTeamSize} filled
                        </span>
                      </span>
                      <span className="font-semibold text-zinc-700">{teamProgressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                        style={{ width: `${teamProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setDetailProject(project)}
                    className="text-xs text-zinc-600 hover:text-zinc-900 font-medium py-1.5"
                  >
                    View Project Details
                  </button>

                  <div>
                    {isOwner ? (
                      <span className="text-xs px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-lg font-medium border border-zinc-200">
                        You are Project Owner
                      </span>
                    ) : project.currentTeam.some((m) => m.userId === currentUser.id) ? (
                      <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-800 rounded-lg font-medium border border-indigo-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        You're on this team
                      </span>
                    ) : hasApplied ? (
                      <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg font-medium border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Application Submitted
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setApplicationTargetProject(project);
                          setIsApplicationModalOpen(true);
                        }}
                        className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Apply / Collaborate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      {detailProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => setDetailProject(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl border border-zinc-200 shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-white">
                    {detailProject.category}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 font-medium">
                    {detailProject.collaborationType}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mt-2">{detailProject.title}</h2>
              </div>
              <button
                onClick={() => setDetailProject(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-1">Project Description</h4>
                <p className="text-zinc-600 leading-relaxed">{detailProject.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-1.5">Open Roles</h4>
                <div className="flex flex-wrap gap-2">
                  {detailProject.requiredRoles.map((role, i) => (
                    <span
                      key={`${role}-${i}`}
                      className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-1.5">Key Requirements</h4>
                <ul className="list-disc pl-5 space-y-1 text-zinc-600">
                  {detailProject.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-zinc-900 text-sm mb-1.5">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {detailProject.skillsRequired.map((skill) => (
                    <SkillBadge key={skill} skill={skill} size="sm" />
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-zinc-500">
                  Deadline: <strong className="text-zinc-900">{detailProject.deadline}</strong>
                </span>

                <button
                  onClick={() => {
                    const p = detailProject;
                    setDetailProject(null);
                    setApplicationTargetProject(p);
                    setIsApplicationModalOpen(true);
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium"
                >
                  Submit Collaboration Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
