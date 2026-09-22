import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { VerificationBadge } from './VerificationBadge';
import {
  Compass,
  Users,
  Briefcase,
  Sparkles,
  Layers,
  Calendar,
  Bell,
  MessageSquare,
  Bookmark,
  Plus,
  ChevronDown,
  Menu,
  X,
  UserCheck,
  Building2,
  Check,
  LogOut,
  Rocket,
} from 'lucide-react';
import { ActiveTab } from '../../types';

export const Navbar: React.FC = () => {
  const {
    mode,
    activeTab,
    setActiveTab,
    currentUser,
    users,
    switchUser,
    notifications,
    conversations,
    savedItems,
    openUserProfile,
    setIsProjectCreateOpen,
    globalSearch,
    setGlobalSearch,
  } = useApp();
  const { logout } = useAuth();
  const isDemo = mode === 'demo';

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Explore', icon: Compass },
    { id: 'people', label: 'People & Labs', icon: Users },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'startups', label: 'Startups', icon: Rocket },
    { id: 'communities', label: 'Communities', icon: Layers },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'announcements', label: 'Council Notices', icon: Building2 },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-zinc-800 transition-colors">
                U
              </div>
              <div>
                <span className="font-semibold text-zinc-900 tracking-tight text-base flex items-center gap-1.5">
                  UniCollab
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/70">
                    Campus
                  </span>
                </span>
                <span className="text-[11px] text-zinc-500 block leading-tight">
                  University Collaboration & Marketplace
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 ml-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Section: Actions, Badges & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Post Button */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setIsProjectCreateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-medium transition-colors border border-zinc-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Post Project
              </button>
            </div>

            {/* Persona Switcher (Demo & Role Testing) — demo mode only */}
            {isDemo && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsPersonaMenuOpen(!isPersonaMenuOpen);
                  setIsUserMenuOpen(false);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-colors text-xs font-medium text-zinc-700"
                title="Switch Persona to view student, faculty, or council views"
              >
                <UserCheck className="w-3.5 h-3.5 text-zinc-600" />
                <span className="hidden sm:inline">Role:</span>
                <span className="font-semibold capitalize text-zinc-900">
                  {currentUser.role === 'council_admin' ? 'Council' : currentUser.role}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-0.5" />
              </button>

              {isPersonaMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-zinc-200 p-2 z-50 text-xs animate-pop-in"
                  onClick={() => setIsPersonaMenuOpen(false)}
                >
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Switch Test Persona
                  </div>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => switchUser(u.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        u.id === currentUser.id ? 'bg-zinc-100 text-zinc-900 font-medium' : 'hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover border border-zinc-200"
                        />
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            {u.name}
                            {u.id === currentUser.id && <Check className="w-3 h-3 text-emerald-600" />}
                          </div>
                          <div className="text-[11px] text-zinc-500 line-clamp-1">{u.yearOrTitle}</div>
                        </div>
                      </div>
                      <VerificationBadge verification={u.verification} size="sm" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
            {/* Saved Items */}
            <button
              onClick={() => setActiveTab('saved')}
              className={`relative p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors ${
                activeTab === 'saved' ? 'bg-zinc-100 text-zinc-900' : ''
              }`}
              title="Saved Items"
            >
              <Bookmark className="w-4 h-4" />
              {savedItems.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>

            {/* Messages */}
            <button
              onClick={() => setActiveTab('messages')}
              className={`relative p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors ${
                activeTab === 'messages' ? 'bg-zinc-100 text-zinc-900' : ''
              }`}
              title="Messages"
            >
              <MessageSquare className="w-4 h-4" />
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                  {totalUnreadMessages}
                </span>
              )}
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsUserMenuOpen(false);
                  setIsPersonaMenuOpen(false);
                }}
                className={`relative p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors ${
                  isNotificationsOpen ? 'bg-zinc-100 text-zinc-900' : ''
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notifications Popover */}
              {isNotificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden z-50 animate-pop-in"
                >
                  <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-800">Notifications</span>
                    <span className="text-[11px] text-zinc-500">
                      {unreadNotifications.length} unread
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">No notifications yet</div>
                    ) : (
                      notifications.slice(0, 6).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs hover:bg-zinc-50 cursor-pointer transition-colors ${
                            !notif.isRead ? 'bg-blue-50/40' : ''
                          }`}
                          onClick={() => {
                            if (notif.linkTab) setActiveTab(notif.linkTab);
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-zinc-900">{notif.title}</span>
                            <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-zinc-600 text-[11px] mt-0.5 line-clamp-2">
                            {notif.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Avatar & Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsPersonaMenuOpen(false);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-zinc-200 transition-all"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-zinc-200"
                />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 p-2 z-50 text-xs animate-pop-in"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="p-2 border-b border-zinc-100">
                    <div className="font-semibold text-zinc-900">{currentUser.name}</div>
                    <div className="text-[11px] text-zinc-500">@{currentUser.username}</div>
                    <div className="mt-1.5">
                      <VerificationBadge verification={currentUser.verification} size="sm" />
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => openUserProfile(currentUser.id)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 text-zinc-700 font-medium"
                    >
                      View Public Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 text-zinc-700 font-medium"
                    >
                      My Dashboard
                    </button>
                    <button
                      onClick={() => setActiveTab('saved')}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 text-zinc-700 font-medium"
                    >
                      Saved Bookmarks ({savedItems.length})
                    </button>
                  </div>

                  <div className="pt-1 border-t border-zinc-100">
                    <div className="px-3 py-1 text-[11px] text-zinc-400">
                      {currentUser.university}
                    </div>
                    {mode === 'live' && (
                      <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-medium text-xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-zinc-200/80 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
              <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsProjectCreateOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2 bg-zinc-900 text-white rounded-lg text-xs font-medium text-center"
                  >
                    + Post Project
                  </button>
                </div>
              </div>
          </div>
        )}

      </div>
    </header>
  );
};
