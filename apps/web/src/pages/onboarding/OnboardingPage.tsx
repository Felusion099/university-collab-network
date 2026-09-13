import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, SkipForward, Sparkles } from "lucide-react";
import type { UserRole } from "@app/shared-types";
import { useMe, useCompleteOnboarding, useUpdateOwnProfile } from "@/hooks/useMe";
import { useSessionStore } from "@/stores/session.store";
import { apiFetch } from "@/services/api/client";
import { ApiError } from "@/services/api/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * OnboardingPage — the role-aware, progressive, resumable new-user
 * onboarding. Steps adapt to the existing UserRole (no onboarding-role
 * enum): basic identity → about → skills → research interests → existing
 * work (derived, read-only) → preview → done. Existing profile data is
 * prefilled, never re-asked; optional steps are skippable; completion is
 * marked via users.onboarding_completed_at (POST /users/me/onboarding/
 * complete). Resume detection lives in AppLayout's OnboardingGuard.
 */
const STEP_LABELS = ["Welcome", "About you", "Skills", "Interests", "Your work", "Preview"];

export default function OnboardingPage(): JSX.Element {
  const { data: me, isLoading, isError, refetch } = useMe();
  const complete = useCompleteOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

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

  const handleDone = () => {
    complete.mutate(undefined, {
      onSuccess: () => navigate("/dashboard"),
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-1.5">
            <div
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent-500" : "bg-sunken"}`}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-text-muted">
        Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
      </p>

      {step === 0 && <WelcomeStep role={me.role} name={me.studentProfile?.fullName ?? me.professorProfile?.fullName ?? me.researcherProfile?.fullName ?? "there"} onNext={() => setStep(1)} />}
      {step === 1 && <AboutStep me={me} onNext={() => setStep(2)} />}
      {step === 2 && <SkillsStep me={me} onNext={() => setStep(3)} onSkip={() => setStep(3)} />}
      {step === 3 && <InterestsStep me={me} onNext={() => setStep(4)} onSkip={() => setStep(4)} />}
      {step === 4 && <ExistingWorkStep me={me} onNext={() => setStep(5)} onSkip={() => setStep(5)} />}
      {step === 5 && <PreviewStep me={me} onDone={handleDone} onBack={() => setStep(4)} />}
    </div>
  );
}

function WelcomeStep({
  role,
  name,
  onNext,
}: {
  role: UserRole;
  name: string;
  onNext: () => void;
}) {
  const focus = ROLE_FOCUS[role];
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-accent-600" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-text-primary">Welcome, {name}</h1>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">
        This platform connects your university's students, professors, researchers, projects, and
        research — and builds a living portfolio for you as you use it. Everything you join, create,
        or publish here shows up on your portfolio automatically.
      </p>
      <div className="rounded-lg border border-border bg-raised p-4 text-sm text-text-secondary">
        <p className="mb-1 font-medium text-text-primary">As a {role}, we'll focus on:</p>
        <ul className="list-inside list-disc space-y-1">
          {focus.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <StepActions onNext={onNext} nextLabel="Get started" onSkip={onNext} skipLabel="Skip intro" />
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

function AboutStep({
  me,
  onNext,
}: {
  me: NonNullable<ReturnType<typeof useMe>["data"]>;
  onNext: () => void;
}) {
  const updateProfile = useUpdateOwnProfile();
  const profile = me.studentProfile ?? me.professorProfile ?? me.researcherProfile;
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [department, setDepartment] = useState(
    me.studentProfile?.department ?? me.professorProfile?.department ?? me.researcherProfile?.department ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async (advance: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const input: Record<string, unknown> = {};
      if (me.studentProfile) {
        input.studentProfile = { bio: bio.trim() || null, department: department.trim() || null };
      } else if (me.professorProfile) {
        input.professorProfile = { bio: bio.trim() || null, department: department.trim() || null };
      } else if (me.researcherProfile) {
        input.researcherProfile = { bio: bio.trim() || null, department: department.trim() || null };
      }
      if (Object.keys(input).length > 0) {
        await updateProfile.mutateAsync(input);
      }
      if (advance) onNext();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-text-primary">Tell people about yourself</h1>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div>
        <label htmlFor="ob-department" className="mb-1 block text-sm font-medium text-text-primary">
          {me.studentProfile ? "Department / program" : "Department"}
        </label>
        <input
          id="ob-department"
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., Computer Science"
          disabled={saving}
        />
      </div>
      <div>
        <label htmlFor="ob-bio" className="mb-1 block text-sm font-medium text-text-primary">
          Short bio
        </label>
        <textarea
          id="ob-bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={
            me.professorProfile
              ? "What do you research and teach?"
              : me.researcherProfile
                ? "What are you currently researching?"
                : "What are you studying and excited about?"
          }
          disabled={saving}
        />
      </div>
      <StepActions onNext={() => save(true)} nextLabel="Continue" onSkip={() => save(true)} skipLabel="Skip for now" disabled={saving} />
    </div>
  );
}

function SkillsStep({
  me,
  onNext,
  onSkip,
}: {
  me: NonNullable<ReturnType<typeof useMe>["data"]>;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [skillName, setSkillName] = useState("");
  const [skills, setSkills] = useState<string[]>(
    (me.portfolio?.skills ?? []).map((s) => s.name),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addSkill = async () => {
    if (!skillName.trim() || skills.includes(skillName.trim())) return;
    setSaving(true);
    setError(null);
    try {
      // POST /skills (create-or-get) then POST /skills/:id/self — the
      // existing skill system, no new tables.
      const res = await apiFetch<{ id: string; name?: string }>("/skills", {
        method: "POST",
        body: { name: skillName.trim() },
      });
      await apiFetch(`/skills/${res.id}/self`, { method: "POST" });
      setSkills((prev) => [...prev, skillName.trim()]);
      setSkillName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add skill. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-text-primary">Your skills</h1>
      <p className="text-sm text-text-secondary">
        Skills help project leads and professors find you for collaborations.
      </p>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {me.professorProfile && me.professorProfile.expertise.length > 0 && (
        <div className="rounded-lg border border-border bg-raised p-3 text-sm text-text-secondary">
          <p className="mb-1 font-medium text-text-primary">Your existing expertise (from your profile):</p>
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
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g., React, Machine Learning, PCB Design"
          disabled={saving}
        />
        <button
          type="button"
          onClick={addSkill}
          disabled={saving || !skillName.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700"
            >
              <Check className="h-3 w-3" aria-hidden="true" />
              {s}
            </span>
          ))}
        </div>
      )}
      <StepActions onNext={onNext} nextLabel="Continue" onSkip={onSkip} skipLabel="Skip for now" />
    </div>
  );
}

function InterestsStep({
  me,
  onNext,
  onSkip,
}: {
  me: NonNullable<ReturnType<typeof useMe>["data"]>;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState<{ id: string; name: string }[]>(
    (me.portfolio?.researchTopics ?? []).map((t) => ({ id: t.id, name: t.name })),
  );
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
      const matches = (res.data ?? []).filter(
        (t) => t.name.toLowerCase().includes(q.trim().toLowerCase()),
      );
      setResults(matches);
    } catch {
      setResults([]);
    }
  };

  const attach = async (topic: { id: string; name: string }) => {
    setError(null);
    try {
      // UserResearchTopic link via the existing interests endpoint shape:
      // POST /users/me/interests { topicId } (canonical users route).
      await apiFetch("/users/me/interests", {
        method: "POST",
        body: { topicId: topic.id },
      });
      setTopics((prev) =>
        prev.some((t) => t.id === topic.id) ? prev : [...prev, topic],
      );
      setResults([]);
      setQuery("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add interest. Try again.");
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-text-primary">Research interests</h1>
      <p className="text-sm text-text-secondary">
        Pick research areas to discover relevant teams, projects, and people.
      </p>
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <input
        type="text"
        value={query}
        onChange={(e) => void search(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Search research areas…"
      />
      {results.length > 0 && (
        <ul className="space-y-1 rounded-md border border-border bg-raised p-2">
          {results.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => void attach(t)}
                className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-sunken"
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700"
            >
              <Check className="h-3 w-3" aria-hidden="true" />
              {t.name}
            </span>
          ))}
        </div>
      )}
      <StepActions onNext={onNext} nextLabel="Continue" onSkip={onSkip} skipLabel="Skip for now" />
    </div>
  );
}

function ExistingWorkStep({
  me,
  onNext,
  onSkip,
}: {
  me: NonNullable<ReturnType<typeof useMe>["data"]>;
  onNext: () => void;
  onSkip: () => void;
}) {
  const portfolio = me.portfolio;
  const hasWork =
    portfolio &&
    (portfolio.projects.length > 0 ||
      portfolio.researchTeams.length > 0 ||
      portfolio.publications.length > 0 ||
      portfolio.organizations.length > 0);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-text-primary">Your existing work</h1>
      <p className="text-sm text-text-secondary">
        We already know about these from your activity — no need to re-enter anything. Your
        portfolio updates automatically as you join teams, contribute to projects, or publish.
      </p>
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
      <StepActions onNext={onNext} nextLabel="Continue" onSkip={onSkip} skipLabel="Skip" />
    </div>
  );
}

function PreviewStep({
  me,
  onDone,
  onBack,
}: {
  me: NonNullable<ReturnType<typeof useMe>["data"]>;
  onDone: () => void;
  onBack: () => void;
}) {
  const profile = me.studentProfile ?? me.professorProfile ?? me.researcherProfile;
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-text-primary">You're all set</h1>
      <div className="rounded-lg border border-border bg-raised p-4">
        <p className="font-medium text-text-primary">{profile?.fullName}</p>
        <p className="mt-0.5 text-sm text-text-secondary">@{me.username}</p>
        {(me.studentProfile?.department ?? me.professorProfile?.department ?? me.researcherProfile?.department) && (
          <p className="mt-1 text-xs text-text-muted">
            {me.studentProfile?.department ?? me.professorProfile?.department ?? me.researcherProfile?.department}
          </p>
        )}
        {profile?.bio && <p className="mt-2 text-sm text-text-secondary">{profile.bio}</p>}
        {(me.portfolio?.skills.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {me.portfolio!.skills.map((s) => (
              <span key={s.id} className="rounded-full bg-sunken px-2 py-0.5 text-xs text-text-secondary">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm text-text-secondary">
        You can edit everything later from{" "}
        <span className="font-medium text-text-primary">My Portfolio</span> and{" "}
        <span className="font-medium text-text-primary">Settings</span>.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-border px-4 py-2 text-sm text-text-primary hover:bg-sunken"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onDone}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ChevronRight className="h-4 w-4" />
          Enter platform
        </button>
      </div>
    </div>
  );
}

function StepActions({
  onNext,
  nextLabel,
  onSkip,
  skipLabel,
  disabled = false,
}: {
  onNext: () => void;
  nextLabel: string;
  onSkip: () => void;
  skipLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
      >
        <SkipForward className="h-3.5 w-3.5" />
        {skipLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}

// keep useSessionStore import used (role source documented above)
void useSessionStore;
