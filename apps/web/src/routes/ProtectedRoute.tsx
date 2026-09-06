import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSessionStore } from "@/stores/session.store";

/**
 * Redirects unauthenticated visitors to /login, preserving the attempted
 * location in state so login can send them back. Waits out "idle" (the
 * boot-time silent-refresh attempt from useRestoreSession) before deciding,
 * so a page reload doesn't flash-redirect a still-valid session to /login.
 */
export default function ProtectedRoute(): JSX.Element | null {
  const status = useSessionStore((s) => s.status);
  const location = useLocation();

  if (status === "idle") return null; // brief boot-time check, nothing to render yet
  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
