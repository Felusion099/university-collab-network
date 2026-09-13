import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, SkipForward, Sparkles, X } from "lucide-react";
import type { UserRole, UserProfileResponse } from "@app/shared-types";
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
const STEPS = ["Welcome", "About you", "Skills", "Interests", "Your work", "Preview"] as const;

interface Draft {
  bio: string;
  department: string;
  fullName: string;
  headlineFields: {
    course: string;
    year: string;
    designation: string;
    expertise: string;
  };
  skills: string[];
  topics: { id: string; name: string; slug: string }[];
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

  const profile = me.studentProfile ?? me.professorProfile ?? me.researcherProfile;
  const fullName = profile?.fullName ?? "there";

  if (draft === null) {
    setDraft({
      bio: profile?.bio ?? "",
      department:
        me.studentProfile?.department ??
        me.professorProfile?.department ??
        me.researcherProfile?.department ??
        "",
      fullName,
      headlineFields: {
        course: me.studentProfile?.course ?? "",
        year: me.studentProfile?.year !== null && me.studentProfile?.year !== undefined ? String(me.studentProfile.year) : "",
        designation: me.professorProfile?.designation ?? "",
        expertise: (me.professorProfile?.expertise ?? []).join(", "),
      },
      skills: (me.portfolio?.skills ?? []).map((s) => s.name),
      topics: (me.portfolio?.researchTopics ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
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

      {step === 0 && <WelcomeStep role={me.role} name={fullName} onNext={() => setStep(1)} />}
      {step === 1 && <AboutStep me={me} draft={draft} setDraft={setDraft} onNext={() => setStep(2)} />}
      {step === 2 && <SkillsStep me={me} draft={draft} setDraft={setDraft} onNext={() => setStep(3)} />}
      {step === 3 && <InterestsStep draft={draft} setDraft={setDraft} onNext={() => setStep(4)} />}
      {step === 4 && <ExistingWorkStep me={me} onNext={() => setStep(5)} />}
      {step === 5 && (
        <PreviewStep me={me} draft={draft} onDone={() => complete.mutate(undefined, { onSuccess: () => navigate("/dashboard") })} onBack={() => setStep(4)} saving={complete.isPending} />
      )}
    </div>
  );
}

/* ============================================================
 * STEP 1 — Welcome / identity
 * ============================================================ */
function WelcomeStep({ role, name, onNext }: { role: UserRole; name: string; onNext: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-accent-600" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-text-primary">Let's build your profile, {name}</h1>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">
        This is your university portfolio — it tells people who you are, what you know, and what
        you're working on. Everything you join, create, or publish here shows up on it
        automatically. You can edit all of this later.
      </p>
      <div className="rounded-lg border border-border bg-raised p-4 text-sm text-text-secondary">
        <p className="mb-1 font-medium text-text-primary">As a {role}, we'll focus on:</p>
        <ul className="list-inside list-disc space-y-1">
          {ROLE_FOCUS[role].map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <StepActions onNext={onNext} nextLabel="Get started" />
    </div>
  );
}

const ROLE_FOCUS: Record<UserRole, string[]> = {
  student: [
    "Your skills and interests",
    "Projects you can contribute to",
    "Research areas you care about",
  ],
  professor: [
    "Your expertise and research",
    "Teams and projects you lead",
    "Mentorship availability",
  ],
  researcher: [
    "Your expertise and current research",
    "Publications and teams",
    "Collaboration availability",
  ],
  alumni: ["Your background and skills", "Organizations you're part of"],
  club_rep: ["Your organization", "Events and opportunities"],
  startup_member: ["Your startup", "Opportunities you're hiring for"],
  admin: ["Platform overview and administration"],
};

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
        input.studentProfile = {
          ...roleProfile,
          course: draft.headlineFields.course.trim() || null,
          year: draft.headlineFields.year.trim() ? Number(draft.headlineFields.year) : null,
        };
      } else if (me.professorProfile) {
        input.professorProfile = {
          ...roleProfile,
          designation: draft.headlineFields.designation.trim() || null,
          expertise: draft.headlineFields.expertise
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean),
        };
      } else if (me.researcherProfile) {
        input.researcherProfile = { ...roleProfile };
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
          <Field label="Designation">
            <input
              type="text"
              value={draft.headlineFields.designation}
              onChange={(e) => setDraft({ ...draft, headlineFields: { ...draft.headlineFields, designation: e.target.value } })}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500"
              placeholder="Associate Professor"
              disabled={saving}
            />
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
