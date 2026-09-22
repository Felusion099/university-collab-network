import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/VerificationBadge';
import { SkillBadge } from '../common/SkillBadge';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Send,
  Plus,
  AlertCircle,
  FolderGit2,
  BookOpen,
  Check,
  X,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    projects,
    applications,
    collabRequests,
    portfolio,
    users,
    handleApplicationStatus,
    handleCollaborationStatus,
    setIsProjectCreateOpen,
    setIsPortfolioAddOpen,
    openUserProfile,
    setActiveTab,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'overview' | 'applications' | 'collaborations' | 'myprojects'>('overview');

  // Filtered data for current user
  const myProjects = projects.filter(
    (p) => p.ownerId === currentUser.id || p.currentTeam.some((m) => m.userId === currentUser.id)
  );

  const myOwnedProjects = projects.filter((p) => p.ownerId === currentUser.id);

  // Incoming applications to projects owned by current user
  const incomingApplications = applications.filter((a) =>
    myOwnedProjects.some((p) => p.id === a.projectId)
  );

  // Applications sent by current user
  const sentApplications = applications.filter((a) => a.applicantId === currentUser.id);

  // Collaboration requests received
  const incomingCollabRequests = collabRequests.filter(
    (r) => r.receiverId === currentUser.id
  );

  // Collaboration requests sent
  const sentCollabRequests = collabRequests.filter(
    (r) => r.senderId === currentUser.id
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-stone-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
              Campus Workspace & Hub
            </span>
            <VerificationBadge verification={currentUser.verification} size="sm" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight">
            Welcome back, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-xl leading-relaxed">
            {currentUser.role === 'professor'
              ? 'Manage your laboratory research openings, student assistant applications, and faculty collaborations.'
              : currentUser.role === 'council_admin'
              ? 'Administer campus council notices, student innovation grants, and technical symposiums.'
              : 'Track your hackathon team applications, peer collaboration invitations, and active campus projects.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setIsProjectCreateOpen(true)}
            className="px-4 py-2 bg-white text-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-100 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Post New Project
          </button>
          <button
            onClick={() => setIsPortfolioAddOpen(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors border border-zinc-700 flex items-center gap-1.5"
          >
            <FolderGit2 className="w-4 h-4" />
            Add Work
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="p-5 bg-white rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Active Teams</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">{myProjects.length}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Projects & labs</div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Proposals Received</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">{incomingApplications.length}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">From campus peers</div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Collaboration Invites</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">{incomingCollabRequests.length}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Pending response</div>
        </div>
        <div className="p-5 bg-white rounded-xl border border-zinc-200 shadow-xs">
          <div className="text-zinc-500 text-xs font-medium">Portfolio Items</div>
          <div className="text-2xl font-bold text-zinc-900 mt-1">{currentUser.stats.portfolioCount}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Public showcase</div>
        </div>
      </div>

      {/* Sections Sub-tabs */}
      <div className="flex items-center gap-2 mt-8 border-b border-zinc-200 pb-3 text-xs font-medium overflow-x-auto">
        {[
          { id: 'overview', label: 'All Activities' },
          { id: 'applications', label: `Project Proposals (${incomingApplications.length + sentApplications.length})` },
          { id: 'collaborations', label: `Direct Invites (${incomingCollabRequests.length})` },
          { id: 'myprojects', label: `My Teams (${myProjects.length})` },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as any)}
            className={`px-3.5 py-1.5 rounded-lg transition-colors shrink-0 ${
              activeSection === sec.id
                ? 'bg-zinc-900 text-white font-semibold'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: INCOMING PROPOSALS & APPLICATIONS */}
      {(activeSection === 'overview' || activeSection === 'applications') && (
        <div className="mt-8 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-zinc-900">
                Incoming Project Proposals ({incomingApplications.length})
              </h3>
              <span className="text-xs text-zinc-500">Applications to projects you created</span>
            </div>

            {incomingApplications.length === 0 ? (
              <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 text-center">
                No incoming proposals to review at this time.
              </div>
            ) : (
              <div className="space-y-4">
                {incomingApplications.map((app) => {
                  const applicant = users.find((u) => u.id === app.applicantId) || users[0];
                  const project = projects.find((p) => p.id === app.projectId);

                  return (
                    <div
                      key={app.id}
                      className="p-5 bg-white rounded-xl border border-zinc-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <img
                            src={applicant.avatar}
                            alt={applicant.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => openUserProfile(applicant.id)}
                                className="font-semibold text-xs text-zinc-900 hover:underline cursor-pointer"
                              >
                                {applicant.name}
                              </span>
                              <VerificationBadge verification={applicant.verification} size="sm" />
                            </div>
                            <span className="text-[11px] text-zinc-500">
                              Applied for <strong>{app.roleApplied}</strong> on {project?.title}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-700 mt-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200/70 leading-relaxed">
                          "{app.message}"
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-zinc-500">
                          <span>Timeline: <strong>{app.proposedTimeline}</strong></span>
                          <span>·</span>
                          <span>Submitted: {app.submittedAt}</span>
                          {app.portfolioLinks.length > 0 && (
                            <>
                              <span>·</span>
                              <a
                                href={app.portfolioLinks[0]}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Portfolio Reference
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status / Accept buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {app.status === 'Accepted' ? (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Accepted to Team
                          </span>
                        ) : app.status === 'Rejected' ? (
                          <span className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium border border-zinc-200">
                            Declined
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApplicationStatus(app.id, 'Rejected')}
                              className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleApplicationStatus(app.id, 'Accepted')}
                              className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept to Team
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sent Applications */}
          <div>
            <h3 className="text-base font-bold text-zinc-900 mb-3">
              Proposals You've Submitted ({sentApplications.length})
            </h3>
            {sentApplications.length === 0 ? (
              <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 text-center">
                You haven't submitted any project proposals yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sentApplications.map((app) => {
                  const targetProj = projects.find((p) => p.id === app.projectId);
                  return (
                    <div
                      key={app.id}
                      className="p-4 bg-white rounded-xl border border-zinc-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-zinc-900">{targetProj?.title || 'Project'}</div>
                        <div className="text-zinc-500 text-[11px] mt-0.5">
                          Role: <strong>{app.roleApplied}</strong> · Submitted: {app.submittedAt}
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                          app.status === 'Accepted'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : app.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: DIRECT COLLABORATION REQUESTS */}
      {(activeSection === 'overview' || activeSection === 'collaborations') && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-zinc-900">
              Direct Collaboration Invitations ({incomingCollabRequests.length})
            </h3>
            <span className="text-xs text-zinc-500">Invitations sent directly to you</span>
          </div>

          {incomingCollabRequests.length === 0 ? (
            <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500 text-center">
              No pending collaboration invitations.
            </div>
          ) : (
            incomingCollabRequests.map((req) => {
              const sender = users.find((u) => u.id === req.senderId) || users[0];
              return (
                <div
                  key={req.id}
                  className="p-5 bg-white rounded-xl border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <img
                        src={sender.avatar}
                        alt={sender.name}
                        className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => openUserProfile(sender.id)}
                            className="font-semibold text-xs text-zinc-900 hover:underline cursor-pointer"
                          >
                            {sender.name}
                          </span>
                          <VerificationBadge verification={sender.verification} size="sm" />
                        </div>
                        <span className="text-[11px] text-zinc-500 capitalize">
                          {req.type} Invitation · {sender.department}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-zinc-900 mt-2">{req.title}</h4>
                    <p className="text-xs text-zinc-600 mt-1 leading-relaxed">"{req.message}"</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'Accepted' ? (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                        Accepted
                      </span>
                    ) : req.status === 'Declined' ? (
                      <span className="px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium border border-zinc-200">
                        Declined
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCollaborationStatus(req.id, 'Declined')}
                          className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-medium"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleCollaborationStatus(req.id, 'Accepted')}
                          className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold"
                        >
                          Accept Invite
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SECTION 3: MY PROJECTS & TEAMS */}
      {(activeSection === 'overview' || activeSection === 'myprojects') && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-zinc-900">
              My Active Projects & Teams ({myProjects.length})
            </h3>
            <button
              onClick={() => setIsProjectCreateOpen(true)}
              className="text-xs text-zinc-800 hover:underline font-medium"
            >
              + Post New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 bg-white rounded-xl border border-zinc-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                      {p.category}
                    </span>
                    <span>Deadline: {p.deadline}</span>
                  </div>
                  <h4 className="font-bold text-sm text-zinc-900 mt-2">{p.title}</h4>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <span>{p.currentTeam.length} / {p.maxTeamSize} Team Members</span>
                  <button
                    onClick={() => setActiveTab('projects')}
                    className="text-xs font-semibold text-zinc-900 hover:underline"
                  >
                    View Project Page →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
