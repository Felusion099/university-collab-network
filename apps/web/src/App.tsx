import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { HomeView } from './components/home/HomeView';
import { LoginPage } from './components/auth/LoginPage';
import { PeopleDiscovery } from './components/discovery/PeopleDiscovery';
import { ProjectDiscovery } from './components/discovery/ProjectDiscovery';
import { ProjectDetailView } from './components/projects/ProjectDetailView';
import { CommunitiesDiscovery } from './components/discovery/CommunitiesDiscovery';
import { StartupsView } from './components/discovery/StartupsView';
import { EventsDiscovery } from './components/discovery/EventsDiscovery';
import { AnnouncementsView } from './components/discovery/AnnouncementsView';
import { DashboardView } from './components/dashboard/DashboardView';
import { MessagesView } from './components/communication/MessagesView';
import { SavedItemsView } from './components/dashboard/SavedItemsView';

// Modals
import { UserProfileModal } from './components/profile/UserProfileModal';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { AddPortfolioModal } from './components/profile/AddPortfolioModal';
import { CreateProjectModal } from './components/creation/CreateProjectModal';
import { EditProjectModal } from './components/creation/EditProjectModal';
import { ProjectApplicationModal } from './components/creation/ProjectApplicationModal';
import { ConnectionRequestModal } from './components/creation/ConnectionRequestModal';
import { ShieldCheck, GraduationCap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-3 font-sans">
    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
      <GraduationCap className="w-5 h-5" />
    </div>
    <div className="flex items-center gap-2 text-sm text-zinc-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading the campus network…
    </div>
  </div>
);

const ToastHost: React.FC = () => {
  const { toast } = useApp();
  if (!toast) return null;
  const isError = toast.kind === 'error';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-fade-in-up">
      <div
        className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border max-w-md ${
          isError
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-zinc-900 text-white border-zinc-700'
        }`}
        role="status"
      >
        {isError ? (
          <AlertCircle className="w-4 h-4 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
        )}
        {toast.message}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeTab, isLoading, selectedProjectId, setSelectedProjectId } = useApp();

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      {/* Top Global Navigation Bar */}
      <Navbar />

      {/* Main Tab Views — a selected project renders the full detail view */}
      <main className="flex-1 pb-16">
        {isLoading ? (
          <LoadingScreen />
        ) : selectedProjectId ? (
          <ProjectDetailView />
        ) : (
          <>
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'people' && <PeopleDiscovery />}
            {activeTab === 'projects' && <ProjectDiscovery />}
              {activeTab === 'startups' && <StartupsView />}
            {activeTab === 'communities' && <CommunitiesDiscovery />}
            {activeTab === 'events' && <EventsDiscovery />}
            {activeTab === 'announcements' && <AnnouncementsView />}
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'messages' && <MessagesView />}
            {activeTab === 'saved' && <SavedItemsView />}
          </>
        )}
      </main>

      {/* Global Modals */}
      <UserProfileModal />
      <EditProfileModal />
      <AddPortfolioModal />
      <CreateProjectModal />
      <EditProjectModal />
      <ProjectApplicationModal />
      <ConnectionRequestModal />

      {/* Toasts */}
      <ToastHost />

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200 py-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center text-white">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-zinc-900">University Collaboration Network</span>
            <span>—</span>
            <span>Academic & Student Innovation Marketplace</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-zinc-600">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Verified .edu Institutional Network
            </span>
            <span>·</span>
            <span>Powered by a real Express + PostgreSQL API</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

/** Root decides between the login gate (live mode, no session) and the
 * full app. Switching modes remounts AppProvider for a fresh data load. */
const Root: React.FC = () => {
  const { mode, status } = useAuth();

  if (mode === 'live' && status !== 'authenticated') {
    if (status === 'loading') return <LoadingScreen />;
    return <LoginPage />;
  }

  return (
    <AppProvider mode={mode}>
      <AppContent />
    </AppProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}

export default App;
