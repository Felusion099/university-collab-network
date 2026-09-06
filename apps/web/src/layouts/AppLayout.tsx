import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/Toast";

/**
 * Layout for authenticated app pages. Phase 6 built this as a minimal
 * inline-header shell and explicitly deferred the real Navbar/Sidebar
 * component-library pieces to Phase 7 (ARCHITECTURE.md §5) — this is
 * that follow-through, not a Phase-6-owned-file violation; see Session
 * 18's note in IMPLEMENTATION_STATUS.md. `Toaster` mounted here so any
 * authenticated page can trigger a toast without its own provider.
 */
export default function AppLayout(): JSX.Element {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar className="sticky top-0 hidden h-[calc(100vh-3.5rem)] w-56 flex-shrink-0 md:block" />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
