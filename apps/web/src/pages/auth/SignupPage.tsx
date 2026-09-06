import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useSignup } from "@/hooks/useAuth";
import { ApiError } from "@/services/api/client";
import type { RequestedRole } from "@app/shared-types";

const roles: { value: RequestedRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "professor", label: "Professor" },
  { value: "researcher", label: "Researcher" },
  { value: "club_rep", label: "Club Representative" },
  { value: "startup_member", label: "Startup Member" },
  { value: "alumni", label: "Alumni" },
];

export default function SignupPage(): JSX.Element {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] =
    useState<RequestedRole>("student");
  const [submitted, setSubmitted] = useState(false);

  const signup = useSignup();

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();

    signup.mutate(
      {
        fullName,
        email,
        password,
        requestedRole,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      },
    );
  }

  const errorMessage =
    signup.error instanceof ApiError
      ? signup.error.message
      : signup.error
        ? "Signup failed. Please try again."
        : null;

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text-primary">
          Check your email
        </h1>

        <p className="text-sm text-text-secondary">
          Your account has been created and is waiting for email verification.
          Check your inbox for the verification link or token.
        </p>

        <Link
          to="/login"
          className="rounded-md bg-accent-600 px-4 py-2 text-center text-sm font-medium text-text-onAccent transition-opacity hover:opacity-90"
        >
          Continue to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text-primary">Sign up</h1>

      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Full name
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-md border border-border bg-canvas px-3 py-2 text-text-primary"
        />
      </label>

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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-border bg-canvas px-3 py-2 text-text-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Role
        <select
          value={requestedRole}
          onChange={(e) =>
            setRequestedRole(e.target.value as RequestedRole)
          }
          className="rounded-md border border-border bg-canvas px-3 py-2 text-text-primary"
        >
          {roles.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </label>

      {errorMessage && (
        <p className="text-sm text-danger-600" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={signup.isPending}
        className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {signup.isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link to="/login" className="text-accent-600">
          Log in
        </Link>
      </p>
    </form>
  );
}
