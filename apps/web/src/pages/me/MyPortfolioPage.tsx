import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import { useMe, useUpdateOwnProfile, useVerificationStatus, useRequestVerification } from "@/hooks/useMe";
import { PortfolioView } from "@/components/PortfolioView";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ApiError } from "@/services/api/client";
import type { UserProfileResponse } from "@app/shared-types";

/**
 * MyPortfolioPage (/me) — the logged-in user's own living portfolio
 * (owner view, privacy-unfiltered for self per D-004's owner rule) with
 * inline editing of the role-profile fields. Onboarding is only the
 * initial setup; this page remains editable afterwards.
 */
export default function MyPortfolioPage(): JSX.Element {
  const { data: me, isLoading, isError, refetch } = useMe();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !me) {
    return <ErrorState title="Couldn't load your portfolio" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">My Portfolio</h1>
          <p className="mt-1 text-sm text-text-secondary">
            A living view of your work — it updates automatically as you use the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-text-primary transition-colors hover:bg-sunken"
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? "Done editing" : "Edit profile"}
        </button>
      </div>

      {editing && <EditProfileForms me={me} onSaved={() => setEditing(false)} />}

      <VerificationPanel />

      <PortfolioView user={me} isOwner />
    </div>
  );
}

/**
 * VerificationPanel — the four request states against the existing
 * Verification model. Submitting only ever creates/updates a PENDING
 * row for admin review (requireRole(["admin"]) approve/reject) — a user
 * can never mark themselves verified; the badge is server-authoritative.
 */
function VerificationPanel(): JSX.Element {
  const { data: status, isLoading } = useVerificationStatus();
  const requestVerification = useRequestVerification();
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !status) return <Skeleton className="h-20 w-full rounded-lg" />;

  // VERIFIED — approved verification (or university-verified email)
  if (status.request?.status === "approved" || status.isUniversityVerified) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success-600/30 bg-success-100/40 p-3 text-sm text-text-primary">
        <ShieldCheck className="h-4 w-4 text-success-600" aria-hidden="true" />
        <span className="font-medium">Verified</span>
        <span className="text-text-secondary">
          {status.role === "professor"
            ? "Verified Professor"
            : status.role === "researcher"
              ? "Verified Researcher"
              : "Verified member"}
        </span>
      </div>
    );
  }

  // PENDING — request submitted, awaiting admin review
  if (status.request?.status === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-warning-600/30 bg-warning-100/40 p-3 text-sm text-text-primary">
        <Clock className="h-4 w-4 text-warning-600" aria-hidden="true" />
        <span className="font-medium">Verification pending</span>
        <span className="text-text-secondary">
          An administrator is reviewing your request.
        </span>
      </div>
    );
  }

  const isRejected = status.request?.status === "rejected";

  // NOT VERIFIED / REJECTED — "Request verification"
  const submit = () => {
    setError(null);
    requestVerification.mutate(
      { evidenceUrl: evidenceUrl.trim() || undefined },
      {
        onSuccess: () => setEvidenceUrl(""),
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : "Couldn't submit request."),
      },
    );
  };

  return (
    <div className="rounded-lg border border-border bg-raised p-4">
      <div className="flex items-start gap-2">
        <ShieldAlert
          className={`mt-0.5 h-4 w-4 ${isRejected ? "text-danger-600" : "text-text-muted"}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">
            {isRejected ? "Verification rejected" : "Get verified"}
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {isRejected
              ? "Your previous request was rejected. You may submit a new request with better evidence."
              : "Verified members appear with a badge across the platform. Submit a request for an administrator to review."}
          </p>
          {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="flex-1 rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Evidence URL (e.g., faculty page, GitHub, portfolio)"
            />
            <button
              type="button"
              onClick={submit}
              disabled={requestVerification.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {requestVerification.isPending ? "Submitting…" : "Request verification"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProfileForms({
  me,
  onSaved,
}: {
  me: UserProfileResponse;
  onSaved: () => void;
}) {
  const updateProfile = useUpdateOwnProfile();
  const profile = me.studentProfile ?? me.professorProfile ?? me.researcherProfile;
  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [department, setDepartment] = useState(
    me.studentProfile?.department ?? me.professorProfile?.department ?? me.researcherProfile?.department ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const input: Record<string, unknown> = {};
      const roleProfile: Record<string, unknown> = {
        bio: bio.trim() || null,
        department: department.trim() || null,
      };
      if (me.studentProfile) {
        input.studentProfile = { ...roleProfile, fullName: fullName.trim() || undefined };
      } else if (me.professorProfile) {
        input.professorProfile = { ...roleProfile, fullName: fullName.trim() || undefined };
      } else if (me.researcherProfile) {
        input.researcherProfile = { ...roleProfile, fullName: fullName.trim() || undefined };
      }
      await updateProfile.mutateAsync(input);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-raised p-4">
      {error && <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>}
      <div>
        <label htmlFor="mp-name" className="mb-1 block text-sm font-medium text-text-primary">
          Full name
        </label>
        <input
          id="mp-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          disabled={saving}
        />
      </div>
      <div>
        <label htmlFor="mp-dept" className="mb-1 block text-sm font-medium text-text-primary">
          Department
        </label>
        <input
          id="mp-dept"
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          disabled={saving}
        />
      </div>
      <div>
        <label htmlFor="mp-bio" className="mb-1 block text-sm font-medium text-text-primary">
          Bio
        </label>
        <textarea
          id="mp-bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
          disabled={saving}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Link
          to="/settings"
          className="rounded-md px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
        >
          Privacy & skills in Settings
        </Link>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
