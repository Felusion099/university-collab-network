import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";
import { ApiError } from "@/services/api/client";

/**
 * Phase 6 placeholder — functional enough to prove the login round-trip
 * against the real API (this phase's acceptance criterion). Phase 7 owns
 * the real visual design for this route.
 */
export default function LoginPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => navigate(from, { replace: true }) });
  }

  const errorMessage =
    login.error instanceof ApiError ? login.error.message : login.error ? "Login failed" : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text-primary">Log in</h1>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-border bg-canvas px-3 py-2 text-text-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Password
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-border bg-canvas px-3 py-2 text-text-primary"
        />
      </label>
      {errorMessage && <p className="text-sm text-danger-600">{errorMessage}</p>}
      <button
        type="submit"
        disabled={login.isPending}
        className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {login.isPending ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-text-secondary">
        Don't have an account?{" "}
        <Link to="/signup" className="text-accent-600">
          Sign up
        </Link>
      </p>
    </form>
  );
}
