import { Link } from "react-router-dom";

/** Phase 6 router-skeleton placeholder — real landing page is Phase 7's job. */
export default function LandingPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4 text-center">
      <h1 className="text-3xl font-semibold text-text-primary">University Collab Network</h1>
      <p className="max-w-md text-text-secondary">
        Connect with students, faculty, and researchers across campus. Landing page — Phase 7.
      </p>
      <div className="flex gap-3">
        <Link
          to="/login"
          className="rounded-md border border-border px-4 py-2 text-sm text-text-primary"
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className="rounded-md bg-accent-600 px-4 py-2 text-sm text-text-onAccent"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
