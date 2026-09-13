import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/Toast";
import { useOnboardingStatus } from "@/hooks/useMe";

/**
 * Layout for authenticated app pages. Phase 6 built this as a minimal
 * inline-header shell and explicitly deferred the real Navbar/Sidebar
 * component-library pieces to Phase 7 (ARCHITECTURE.md §5) — this is
 * that follow-through, not a Phase-6-owned-file violation; see Session
 * 18's note in IMPLEMENTATION_STATUS.md. `Toaster` mounted here so any
 * authenticated page can trigger a toast without its own provider.
 *
 * OnboardingGuard — resumes incomplete new-user onboarding: if the
 * caller's onboarding marker (users.onboarding_completed_at) is unset
 * and they're anywhere other than /onboarding, redirect there. Closing
 * the app mid-onboarding and logging back in lands here, continuing
 * where they left off instead of restarting.
 */
export default function AppLayout(): JSX.Element {
  const { data: onboarding, isLoading } = useOnboardingStatus();
  const location = useLocation();

  const shouldRedirect =
    !isLoading && onboarding && !onboarding.completed && location.pathname !== "/onboarding";

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar className="sticky top-0 hidden h-[calc(100vh-3.5rem)] w-56 flex-shrink-0 md:block" />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {shouldRedirect ? <Navigate to="/onboarding" replace /> : <Outlet />}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
