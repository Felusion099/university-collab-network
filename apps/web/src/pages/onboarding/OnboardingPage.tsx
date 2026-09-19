import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, SkipForward, X } from "lucide-react";
import type { UserProfileResponse } from "@app/shared-types";
import { useMe, useCompleteOnboarding, useUpdateOwnProfile } from "@/hooks/useMe";
import { apiFetch, ApiError } from "@/services/api/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * OnboardingPage — the role-aware, progressive, resumable new-user
 * profile builder. One authoritative completion marker
 * (users.onboarding_completed_at) — completing twice is impossible
 * (the service only sets it once) and the AppLayout guard only
 * redirects while it is unset.
 *
 * Draft state lives at THIS component level (single `draft` object), so
 * Back/forward between steps never loses entered values and never
 * duplicates submissions — each step saves via idempotent upserts
 * (PATCH /users/me/profile, POST /skills + POST /skills/:id/self with
 * client-side dedupe, POST /users/me/interests with composite-PK
 * upsert).
 */
const STEPS = ["Status", "About you", "Interests", "Skills", "Goals", "Your work", "Preview"] as const;

interface Draft {
  status: string;
  bio: string;
  department: string;
  fullName: string;
  headlineFields: {
    course: string;
    year: string;
    university: string;
    designation: string;
    expertise: string;
    institution: string;
    researchAreas: string;
    organization: string;
    jobTitle: string;
    professionalArea: string;
    specialization: string;
  };
  skills: string[];
  topics: { id: string; name: string; slug: string }[];
  goals: string[];
}

export default function OnboardingPage(): JSX.Element {
  const { data: me, isLoading, isError, refetch } = useMe();
  const complete = useCompleteOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !me) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => refetch()} />;
  }

  const profile =
    me.studentProfile ?? me.professorProfile ?? me.researcherProfile ?? me.professionalProfile;
  const fullName = profile?.fullName ?? "there";

  if (draft === null) {
    setDraft({
      status: me.role,
      bio: profile?.bio ?? "",
      department:
        me.studentProfile?.department ??
        me.professorProfile?.department ??
        me.researcherProfile?.department ??
        me.professionalProfile?.professionalArea ??
        "",
      fullName,
      headlineFields: {
        course: me.studentProfile?.course ?? "",
        year: me.studentProfile?.year !== null && me.studentProfile?.year !== undefined ? String(me.studentProfile.year) : "",
        university: me.studentProfile?.university ?? "",
        designation: me.professorProfile?.designation ?? "",
        expertise: (me.professorProfile?.expertise ?? []).join(", "),
        institution: me.professorProfile?.institution ?? me.researcherProfile?.institution ?? "",
        researchAreas: (me.researcherProfile?.researchAreas ?? []).join(", "),
        organization: me.professionalProfile?.organization ?? "",
        jobTitle: me.professionalProfile?.jobTitle ?? "",
        professionalArea: me.professionalProfile?.professionalArea ?? "",
        specialization: me.professionalProfile?.specialization ?? "",
      },
      skills: (me.portfolio?.skills ?? []).map((s) => s.name),
      topics: (me.portfolio?.researchTopics ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
      goals: me.goals ?? [],
    });
    return <div className="mx-auto max-w-xl"><Skeleton className="h-32 w-full" /></div>;
  }

  const back = () => (step === 0 ? navigate("/dashboard") : setStep(step - 1));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={back}
          aria-label="Back"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-sunken hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex flex-1 items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent-500" : "bg-sunken"}`}
            />
          ))}
        </div>
        <span className="text-xs text-text-muted">
          {step + 1} of {STEPS.length}
        </span>
      </div>

      {step === 0 && (
        <StatusStep
          draft={draft}
          setDraft={setDraft}
          onNext={() => setStep(1)}
          onStatusChange={() => refetch()}
        />
      )}
      {step === 1 && <AboutStep me={me} draft={draft} setDraft={setDraft} onNext={() => setStep(2)} />}
      {step === 2 && <InterestsStep draft={draft} setDraft={setDraft} onNext={() => setStep(3)} />}
      {step === 3 && <SkillsStep me={me} draft={draft} setDraft={setDraft} onNext={() => setStep(4)} />}
      {step === 4 && <GoalsStep draft={draft} setDraft={setDraft} onNext={() => setStep(5)} />}
      {step === 5 && <ExistingWorkStep me={me} onNext={() => setStep(6)} />}
      {step === 6 && (
        <PreviewStep me={me} draft={draft} onDone={() => complete.mutate(undefined, { onSuccess: () => navigate("/dashboard") })} onBack={() => setStep(5)} saving={complete.isPending} />
      )}
    </div>
  );
}

/* ============================================================
 * STEP 0 — STATUS (spec §13: status is identity context, NOT activities)
 * ============================================================ */
const PERSONA_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Currently studying at a university" },
  { value: "professor", label: "Faculty", description: "Teaching and/or research faculty" },
  { value: "researcher", label: "Researcher", description: "Research-focused role" },
  { value: "professional", label: "Professional", description: "Working professionally" },
  { value: "alumni", label: "Alumni", description: "Graduated from a university" },
];

function StatusStep({
  draft,
  setDraft,
  onNext,
  onStatusChange,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onNext: () => void;
  onStatusChange: () => void;
}): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (status: string) => {
    setDraft({ ...draft, status });
    if (status === draft.status) {
      onNext();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { meApi } = await import("@/services/api/me");
      await meApi.updateStatus(status);
      onStatusChange();
      onNext();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">What is your status?</h1>
        <p className="mt-1 text-sm text-text-secondary">
          This shapes your profile — you can still join projects, clubs, research, and startups
          regardless of status.
        </p>
      </div>
      {error && <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Status">
        {PERSONA_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={draft.status === opt.value}
            onClick={() => void choose(opt.value)}
            disabled={saving}
            className={`rounded-lg border p-3 text-left transition-colors ${
              draft.status === opt.value
                ? "border-accent-500 bg-accent-100"
                : "border-border bg-raised hover:bg-sunken"
            } disabled:opacity-50`}
          >
            <p className="text-sm font-medium text-text-primary">{opt.label}</p>
            <p className="mt-0.5 text-xs text-text-secondary">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * STEP — GOALS (spec §24: what do I want right now — shared step)
 * GOALS ≠ INTERESTS ≠ SKILLS
 * ============================================================ */
const GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: "find_collaborators", label: "Find collaborators" },
  { value: "join_projects", label: "Join projects" },
  { value: "research_opportunities", label: "Research opportunities" },
  { value: "find_mentors", label: "Find mentors" },
  { value: "find_cofounders", label: "Find co-founders" },
  { value: "internships", label: "Internships" },
  { value: "build_team", label: "Build a team" },
  { value: "share_work", label: "Share my work" },
  { value: "startup_opportunities", label: "Startup opportunities" },
  { value: "connect_people", label: "Connect with researchers and students" },
];

function GoalsStep({
  draft,
  setDraft,
  onNext,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onNext: () => void;
}): JSX.Element {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (goal: string) => {
    setDraft({
      ...draft,
      goals: draft.goals.includes(goal)
        ? draft.goals.filter((g) => g !== goal)
        : [...draft.goals, goal],
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { meApi } = await import("@/services/api/me");
      await meApi.updateProfile({ goals: draft.goals });
      onNext();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your goals.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">What do you want right now?</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Goals drive your discovery — what you're looking for, not who you are.
        </p>
      </div>
      {error && <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {GOAL_OPTIONS.map((g) => {
          const active = draft.goals.includes(g.value);
          return (
            <button
              key={g.value}
              type="button"
              onClick={() => toggle(g.value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-600 text-text-onAccent"
                  : "border border-border bg-raised text-text-primary hover:bg-sunken"
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>
      <StepActions onNext={save} nextLabel={saving ? "Saving…" : "Continue"} onSkip={save} disabled={saving} />
    </div>
  );
}


/* ============================================================
 * STEP 2 — Basic profile (name, department, role-specific fields, bio)
 * ============================================================ */
function AboutStep({
  me,
  draft,
  setDraft,
  onNext,
}: {
  me: UserProfileResponse;
  draft: Draft;
  setDraft: (d: Draft) => void;
  onNext: () => void;
}) {
  const updateProfile = useUpdateOwnProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const input: Record<string, unknown> = {};
      const roleProfile: Record<string, unknown> = {
        bio: draft.bio.trim() || null,
        department: draft.department.trim() || null,
        fullName: draft.fullName.trim() || undefined,
      };
      if (me.studentProfile) {
        // Student AND Alumni both reuse StudentProfile (repository pattern)
        input.studentProfile = {
          ...roleProfile,
          university: draft.headlineFields.university.trim() || null,
          course: draft.headlineFields.course.trim() || null,
          year: draft.headlineFields.year.trim() ? Number(draft.headlineFields.year) : null,
        };
      } else if (me.professorProfile) {
        // Faculty branch (spec §15): institution + department + structured title
        input.professorProfile = {
          ...roleProfile,
          institution: draft.headlineFields.institution.trim() || null,
          designation: draft.headlineFields.designation.trim() || null,
          expertise: draft.headlineFields.expertise
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
        };
      } else if (me.researcherProfile) {
        // Researcher branch (spec §17): institution + research areas
        input.researcherProfile = {
          ...roleProfile,
          institution: draft.headlineFields.institution.trim() || null,
          researchAreas: draft.headlineFields.researchAreas
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
        };
      } else if (me.professionalProfile) {
        // Professional branch (spec §20): concise context, no résumé
        input.professionalProfile = {
          fullName: draft.fullName.trim() || undefined,
          bio: draft.bio.trim() || null,
          organization: draft.headlineFields.organization.trim() || null,
          jobTitle: draft.headlineFields.jobTitle.trim() || null,
          professionalArea: draft.headlineFields.professionalArea.trim() || null,
          specialization: draft.headlineFields.specialization.trim() || null,
        };
      }
      if (Object.keys(input).length > 0) {
        await updateProfile.mutateAsync(input);
      }
      onNext();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Basic profile</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Give collaborators a quick picture of who you are.
        </p>
      </div>
      {error && <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>}
      <Field label="Full name">
        <input
          type="text"
          value={draft.fullName}
          onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          disabled={saving}
        />
      </Field>
      <Field label={me.studentProfile ? "Department / program" : "Department"}>
        <input
          type="text"
          value={draft.department}
          onChange={(e) => setDraft({ ...draft, department: e.target.value })}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="e.g., Computer Science"
          disabled={saving}
        />
      </Field>
      {me.studentProfile && (
        <Field label="University">
          <input
            type="text"
            value={draft.headlineFields.university}
            onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, university: e.target.value } })}
            className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
            placeholder="e.g., Bennett University"
            disabled={saving}
          />
        </Field>
      )}
      {me.studentProfile && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Course / degree">
            <input
              type="text"
              value={draft.headlineFields.course}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, course: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="B.Tech CSE"
              disabled={saving}
            />
          </Field>
          <Field label="Year">
            <input
              type="number"
              min={1}
              max={10}
              value={draft.headlineFields.year}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, year: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
              disabled={saving}
            />
          </Field>
        </div>
      )}
      {me.professorProfile && (
        <>
          <Field label="Institution">
            <input
              type="text"
              value={draft.headlineFields.institution}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, institution: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="e.g., Bennett University"
              disabled={saving}
            />
          </Field>
          <Field label="Academic role / title">
            <select
              value={draft.headlineFields.designation}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, designation: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
              disabled={saving}
            >
              <option value="">Select a title</option>
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Visiting Faculty">Visiting Faculty</option>
              <option value="Adjunct Faculty">Adjunct Faculty</option>
              <option value="Teaching Faculty">Teaching Faculty</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Expertise" hint="Comma-separated — students discover you through these.">
            <input
              type="text"
              value={draft.headlineFields.expertise}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, expertise: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Machine Learning, Computer Vision"
              disabled={saving}
            />
          </Field>
        </>
      )}
      {me.researcherProfile && (
        <>
          <Field label="Research institution">
            <input
              type="text"
              value={draft.headlineFields.institution}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, institution: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="e.g., IIT Delhi"
              disabled={saving}
            />
          </Field>
          <Field label="Research areas" hint="Comma-separated — your primary research domains.">
            <input
              type="text"
              value={draft.headlineFields.researchAreas}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, researchAreas: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="e.g., Computer Vision, Robotics"
              disabled={saving}
            />
          </Field>
        </>
      )}
      {me.professionalProfile && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Organization / company">
            <input
              type="text"
              value={draft.headlineFields.organization}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, organization: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="e.g., Acme Corp"
              disabled={saving}
            />
          </Field>
          <Field label="Job title">
            <input
              type="text"
              value={draft.headlineFields.jobTitle}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, jobTitle: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="e.g., Software Engineer"
              disabled={saving}
            />
          </Field>
        </div>
      )}
      <Field label="Short bio">
        <textarea
          rows={4}
          value={draft.bio}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder={
            me.professorProfile
              ? "What do you research and teach?"
              : me.researcherProfile
                ? "What are you currently researching?"
                : "What are you studying and excited about?"
          }
          disabled={saving}
        />
      </Field>
      <StepActions onNext={save} nextLabel={saving ? "Saving…" : "Continue"} onSkip={save} disabled={saving} />
    </div>
  );
}

/* ============================================================
 * STEP 3 — Skills (freelancer-style chips, dedupe, search-backed)
 * ============================================================ */
function SkillsStep({
  me,
  draft,
  setDraft,
  onNext,
}: {
  me: UserProfileResponse;
  draft: Draft;
  setDraft: (d: Draft) => void;
  onNext: () => void;
}) {
  const [skillName, setSkillName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addSkill = async () => {
    const name = skillName.trim();
    if (!name || draft.skills.includes(name)) {
      setSkillName("");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // POST /skills (create-or-get) then POST /skills/:id/self — the
      // existing skill system. UserSkill has a composite PK (userId,
      // skillId) so the link itself is dedup'd by the database.
      const res = await apiFetch<{ id: string; name?: string }>("/skills", {
        method: "POST",
        body: { name },
      });
      await apiFetch(`/skills/${res.id}/self`, { method: "POST" });
      setDraft({ ...draft, skills: [...draft.skills, name] });
      setSkillName("");
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        setSkillName("");
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't add skill. Try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Your skills</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Skills help project leads and professors find you for collaborations.
        </p>
      </div>
      {error && <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>}
      {me.professorProfile && me.professorProfile.expertise.length > 0 && (
        <div className="rounded-lg border border-border bg-raised p-3 text-sm text-text-secondary">
          <p className="mb-1.5 font-medium text-text-primary">Your existing expertise:</p>
          <div className="flex flex-wrap gap-1.5">
            {me.professorProfile.expertise.map((e) => (
              <span key={e} className="rounded-full bg-sunken px-2.5 py-0.5 text-xs text-text-secondary">
                {e}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void addSkill();
            }
          }}
          className="flex-1 rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="Type a skill and press Enter — e.g., React, Machine Learning"
          disabled={saving}
        />
        <button
          type="button"
          onClick={addSkill}
          disabled={saving || !skillName.trim()}
          className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {draft.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {draft.skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700"
            >
              {s}
              <button
                type="button"
                onClick={() => setDraft({ ...draft, skills: draft.skills.filter((x) => x !== s) })}
                className="text-accent-700 hover:text-danger-600"
                aria-label={`Remove ${s}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <StepActions onNext={onNext} nextLabel="Continue" />
    </div>
  );
}

/* ============================================================
 * STEP 4 — Research / project interests
 * ============================================================ */
function InterestsStep({
  draft,
  setDraft,
  onNext,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await apiFetch<{ data?: { id: string; name: string; slug: string }[] }>(
        `/research-topics?limit=5`,
      );
      setResults(
        (res.data ?? [])
          .filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()))
          .filter((t) => !draft.topics.some((d) => d.id === t.id)),
      );
    } catch {
      setResults([]);
    }
  };

  const attach = async (topic: { id: string; name: string; slug: string }) => {
    setError(null);
    try {
      await apiFetch("/users/me/interests", { method: "POST", body: { topicId: topic.id } });
      setDraft({ ...draft, topics: [...draft.topics, topic] });
      setResults([]);
      setQuery("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add interest. Try again.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Research interests</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Research interests connect you with relevant teams, projects, and people.
        </p>
      </div>
      {error && <div className="rounded-md bg-danger-100 p-3 text-sm text-danger-600">{error}</div>}
      <input
        type="text"
        value={query}
        onChange={(e) => void search(e.target.value)}
        className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
        placeholder="Search research areas…"
      />
      {results.length > 0 && (
        <ul className="space-y-1 rounded-md border border-border bg-raised p-2">
          {results.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => void attach({ ...t, slug: "" })}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-sunken"
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {draft.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {draft.topics.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700"
            >
              <Check className="h-3 w-3" aria-hidden="true" />
              {t.name}
              <button
                type="button"
                onClick={async () => {
                  await apiFetch(`/users/me/interests/${t.id}`, { method: "DELETE" });
                  setDraft({ ...draft, topics: draft.topics.filter((x) => x.id !== t.id) });
                }}
                className="text-accent-700 hover:text-danger-600"
                aria-label={`Remove ${t.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <StepActions onNext={onNext} nextLabel="Continue" />
    </div>
  );
}

/* ============================================================
 * STEP 5 — Existing work (derived, read-only)
 * ============================================================ */
function ExistingWorkStep({ me, onNext }: { me: UserProfileResponse; onNext: () => void }) {
  const portfolio = me.portfolio;
  const hasWork =
    portfolio &&
    (portfolio.projects.length > 0 ||
      portfolio.researchTeams.length > 0 ||
      portfolio.publications.length > 0 ||
      portfolio.organizations.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Your existing work</h1>
        <p className="mt-1 text-sm text-text-secondary">
          We already know about these from your activity — no need to re-enter anything. Your
          portfolio updates automatically as you join teams, contribute to projects, or publish.
        </p>
      </div>
      {hasWork ? (
        <div className="space-y-3 rounded-lg border border-border bg-raised p-4 text-sm text-text-secondary">
          {portfolio!.projects.length > 0 && (
            <p>
              <span className="font-medium text-text-primary">Projects:</span>{" "}
              {portfolio!.projects.map((p) => p.name).join(", ")}
            </p>
          )}
          {portfolio!.researchTeams.length > 0 && (
            <p>
              <span className="font-medium text-text-primary">Research teams:</span>{" "}
              {portfolio!.researchTeams.map((t) => t.name).join(", ")}
            </p>
          )}
          {portfolio!.publications.length > 0 && (
            <p>
              <span className="font-medium text-text-primary">Publications:</span>{" "}
              {portfolio!.publications.map((p) => p.title).join(", ")}
            </p>
          )}
          {portfolio!.organizations.length > 0 && (
            <p>
              <span className="font-medium text-text-primary">Organizations:</span>{" "}
              {portfolio!.organizations.map((o) => o.name).join(", ")}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-raised p-4 text-sm text-text-secondary">
          Nothing yet — that's fine. Explore{" "}
          <span className="font-medium text-text-primary">Discover</span> after onboarding to find
          projects, teams, and research to join.
        </div>
      )}
      <StepActions onNext={onNext} nextLabel="Continue" />
    </div>
  );
}

/* ============================================================
 * STEP 6 — Preview ("You can edit this later")
 * ============================================================ */
function PreviewStep({
  me,
  draft,
  onDone,
  onBack,
  saving,
}: {
  me: UserProfileResponse;
  draft: Draft;
  onDone: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">You're all set</h1>
        <p className="mt-1 text-sm text-text-secondary">
          A preview of your portfolio — you can edit everything later from{" "}
          <span className="font-medium text-text-primary">My Portfolio</span> and{" "}
          <span className="font-medium text-text-primary">Settings</span>.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-raised p-4">
        <p className="font-medium text-text-primary">{draft.fullName}</p>
        <p className="mt-0.5 text-sm text-text-secondary">@{me.username}</p>
        {draft.department && <p className="mt-1 text-xs text-text-muted">{draft.department}</p>}
        {draft.bio && <p className="mt-2 text-sm text-text-secondary">{draft.bio}</p>}
        {draft.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {draft.skills.map((s) => (
              <span key={s} className="rounded-full bg-sunken px-2 py-0.5 text-xs text-text-secondary">
                {s}
              </span>
            ))}
          </div>
        )}
        {draft.topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {draft.topics.map((t) => (
              <span key={t.id} className="rounded-full bg-sunken px-2 py-0.5 text-xs text-text-secondary">
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
          {saving ? "Finishing…" : "Enter platform"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * Shared bits
 * ============================================================ */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-text-primary">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

function StepActions({
  onNext,
  nextLabel,
  onSkip,
  disabled = false,
}: {
  onNext: () => void;
  nextLabel: string;
  onSkip?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-sunken hover:text-text-primary disabled:opacity-50"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Skip
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-text-onAccent hover:bg-accent-700 disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}
