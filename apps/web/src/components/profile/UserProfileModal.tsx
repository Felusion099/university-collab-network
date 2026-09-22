import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/VerificationBadge';
import { SkillBadge } from '../common/SkillBadge';
import {
  X,
  MapPin,
  Mail,
  Globe,
  Github,
  Linkedin,
  BookOpen,
  Sparkles,
  MessageSquare,
  Bookmark,
  Plus,
  Edit3,
  ExternalLink,
  Calendar,
  CheckCircle2,
  FolderGit2,
  Layers,
  Clock,
  UserPlus,
} from 'lucide-react';
import { PortfolioItem } from '../../types';

export const UserProfileModal: React.FC = () => {
  const {
    selectedUserId,
    setSelectedUserId,
    users,
    currentUser,
    portfolio,
    projects,
    openProjectDetails,
    startConversationWithUser,
    setCollabTargetUser,
    connections,
    respondToConnectionRequest,
    cancelConnectionRequest,
    setIsCollabModalOpen,
    setIsProfileEditOpen,
    setIsPortfolioAddOpen,
    toggleSaveItem,
    isItemSaved,
  } = useApp();

  const [activeProfileTab, setActiveProfileTab] = useState<
    'work' | 'about' | 'publications' | 'projects'
  >('work');

  if (!selectedUserId) return null;

  const user = users.find((u) => u.id === selectedUserId);
  if (!user) return null;

  const isSelf = user.id === currentUser.id;
  const isSaved = isItemSaved('person', user.id);
  const userPortfolio = portfolio.filter((p) => p.userId === user.id);
  const userProjects = projects.filter(
    (p) => p.ownerId === user.id || p.currentTeam.some((m) => m.userId === user.id)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm overflow-y-auto"
      onClick={() => setSelectedUserId(null)}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Banner */}
        <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-zinc-800 via-zinc-900 to-stone-900 relative">
          <button
            onClick={() => setSelectedUserId(null)}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Header Info */}
        <div className="px-6 sm:px-8 pb-4 relative border-b border-zinc-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4">
            
            {/* Avatar & Presence */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    user.availability === 'available' ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                  title={user.availabilityLabel}
                />
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">{user.name}</h2>
                  <VerificationBadge verification={user.verification} size="md" />
                </div>
                <div className="text-xs text-zinc-500 font-mono">@{user.username}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-end">
              {isSelf ? (
                <>
                  <button
                    onClick={() => setIsProfileEditOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-medium flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setIsPortfolioAddOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Portfolio Work</span>
                  </button>
                </>
              ) : (
                <>
                  {(() => {
                    // Relationship state drives the profile's actions —
                    // professional connections are separate from collaboration
                    const conn = connections.find(
                      (c) =>
                        (c.requesterId === currentUser.id && c.addresseeId === user.id) ||
                        (c.addresseeId === currentUser.id && c.requesterId === user.id),
                    );
                    const connected = conn?.status === 'accepted';
                    const outgoingPending = conn?.status === 'pending' && conn.requesterId === currentUser.id;
                    const incomingPending = conn?.status === 'pending' && conn.addresseeId === currentUser.id;

                    return (
                      <>
                        <button
                          onClick={() => toggleSaveItem('person', user.id)}
                          className={`p-2 rounded-lg border transition-colors ${
                            isSaved
                              ? 'border-blue-200 bg-blue-50 text-blue-600'
                              : 'border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50'
                          }`}
                          title={isSaved ? 'Saved' : 'Save member'}
                        >
                          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>

                        {connected ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUserId(null);
                                startConversationWithUser(user.id);
                              }}
                              className="px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 text-xs font-medium flex items-center gap-1.5 shadow-xs"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Message</span>
                            </button>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Connected
                            </span>
                          </>
                        ) : outgoingPending ? (
                          <button
                            onClick={() => cancelConnectionRequest(conn!.id)}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-amber-50 text-amber-800 rounded-lg text-xs font-medium border border-amber-200 hover:bg-amber-100"
                            title="Cancel your connection request"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Request Sent
                          </button>
                        ) : incomingPending ? (
                          <>
                            <button
                              onClick={() => respondToConnectionRequest(conn!.id, 'declined')}
                              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-medium"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => respondToConnectionRequest(conn!.id, 'accepted')}
                              className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
                            >
                              Accept Connection
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setCollabTargetUser(user);
                              setIsCollabModalOpen(true);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Connect</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Department & Headline */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-zinc-800">
              {user.yearOrTitle} · <span className="text-zinc-500 font-normal">{user.department}</span>
            </div>
            <p className="text-xs text-zinc-700 mt-1 leading-relaxed max-w-3xl">
              {user.headline}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {user.location || user.university}
              </span>
              <span>·</span>
              <span
                className={`font-medium px-2 py-0.5 rounded text-[11px] ${
                  user.availability === 'available'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {user.availabilityLabel}
              </span>
              <span>·</span>
              <span>
                <strong>{user.stats.completedProjects}</strong> Projects Completed
              </span>
            </div>
          </div>

          {/* Profile Navigation Tabs */}
          <div className="flex items-center gap-4 mt-6 border-t border-zinc-100 pt-2 text-xs font-medium text-zinc-500 overflow-x-auto">
            <button
              onClick={() => setActiveProfileTab('work')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeProfileTab === 'work'
                  ? 'border-zinc-900 text-zinc-900 font-semibold'
                  : 'border-transparent hover:text-zinc-800'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Portfolio & Work ({userPortfolio.length})</span>
            </button>

            {user.publications && user.publications.length > 0 && (
              <button
                onClick={() => setActiveProfileTab('publications')}
                className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeProfileTab === 'publications'
                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                    : 'border-transparent hover:text-zinc-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Publications & Research ({user.publications.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveProfileTab('projects')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeProfileTab === 'projects'
                  ? 'border-zinc-900 text-zinc-900 font-semibold'
                  : 'border-transparent hover:text-zinc-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Teams & Projects ({userProjects.length})</span>
            </button>

            <button
              onClick={() => setActiveProfileTab('about')}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                activeProfileTab === 'about'
                  ? 'border-zinc-900 text-zinc-900 font-semibold'
                  : 'border-transparent hover:text-zinc-800'
              }`}
            >
              <span>About & Skills</span>
            </button>
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-zinc-50/40">
          
          {/* TAB 1: Portfolio & Work Showcase */}
          {activeProfileTab === 'work' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-900">Featured Showcase Pieces</h3>
                {isSelf && (
                  <button
                    onClick={() => setIsPortfolioAddOpen(true)}
                    className="text-xs text-zinc-700 hover:text-zinc-900 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Work
                  </button>
                )}
              </div>

              {userPortfolio.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                  <p className="text-xs text-zinc-500">No portfolio items added yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userPortfolio.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-zinc-200/90 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="h-44 bg-zinc-100 overflow-hidden">
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                            <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-700">
                              {item.category}
                            </span>
                            <span>{item.date}</span>
                          </div>

                          <h4 className="font-bold text-zinc-900 text-sm">{item.title}</h4>
                          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                            {item.description}
                          </p>

                          {item.outcomes && (
                            <div className="mt-2.5 p-2 rounded-lg bg-zinc-50 border border-zinc-200/70 text-[11px] text-zinc-700">
                              <span className="font-semibold">Outcome: </span>
                              {item.outcomes}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap gap-1">
                          {item.technologies.map((tech) => (
                            <SkillBadge key={tech} skill={tech} size="xs" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Publications & Research (For Professors & Student Researchers) */}
          {activeProfileTab === 'publications' && user.publications && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900">Peer-Reviewed Scientific Publications</h3>
              {user.publications.map((pub) => (
                <div
                  key={pub.id}
                  className="p-4 bg-white rounded-xl border border-zinc-200 flex items-start justify-between gap-4"
                >
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">{pub.title}</h4>
                    <div className="text-[11px] text-zinc-500 mt-1">
                      {pub.venue} · <span className="font-medium text-zinc-700">{pub.year}</span>
                    </div>
                    {pub.doi && (
                      <div className="text-[10px] font-mono text-zinc-400 mt-1">DOI: {pub.doi}</div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-medium shrink-0">
                    Published
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Teams & Projects — public projects of other users open
              the full project detail view (visibility respected) */}
          {activeProfileTab === 'projects' && (
            <div className="space-y-4">
              {userProjects.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-5 rounded-xl border border-zinc-200 flex items-center justify-between hover:border-zinc-900/20 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-white">
                        {p.category}
                      </span>
                      {p.visibility === 'private' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                          Private
                        </span>
                      )}
                      <span className="text-xs text-zinc-500">Deadline: {p.deadline}</span>
                    </div>
                    <h4
                      onClick={() => {
                        setSelectedUserId(null);
                        openProjectDetails(p.id);
                      }}
                      className="font-bold text-xs text-zinc-900 mt-1 hover:underline cursor-pointer line-clamp-1"
                    >
                      {p.title}
                    </h4>
                    <p className="text-xs text-zinc-600 line-clamp-1 mt-0.5">{p.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUserId(null);
                      openProjectDetails(p.id);
                    }}
                    className="text-xs font-semibold text-zinc-900 hover:underline shrink-0 ml-4"
                  >
                    View Project →
                  </button>
                </div>
              ))}
              {userProjects.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-6">
                  {isSelf ? 'You have no projects yet — post one to get started.' : 'No public projects yet.'}
                </p>
              )}
            </div>
          )}

          {/* TAB 5: About & Skills */}
          {activeProfileTab === 'about' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-zinc-200">
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Biography</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">{user.bio}</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-zinc-200">
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Technical & Creative Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((skill) => (
                    <SkillBadge key={skill} skill={skill} size="sm" />
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-zinc-200">
                <h4 className="text-sm font-bold text-zinc-900 mb-2">Collaboration Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {user.collaborationInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
