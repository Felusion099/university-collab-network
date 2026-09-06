import { Outlet, Link } from "react-router-dom";

/**
 * Layout for unauthenticated flows (login, signup, forgot/reset password).
 * Centered single-column card — deliberately minimal; Phase 7 owns the
 * actual page content rendered via <Outlet />.
 */
export default function AuthLayout(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <Link to="/" className="mb-8 text-lg font-semibold text-text-primary">
        University Collab Network
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-raised p-8 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}
