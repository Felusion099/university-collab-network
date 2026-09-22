import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api/client';
import { Check, ChevronRight, GraduationCap, Loader2, Search, X } from 'lucide-react';

interface SkillRow {
  id: string;
  name: string;
  category: string | null;
}

interface TopicRow {
  researchTopic?: { id?: string; name?: string; slug?: string };
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Postgraduate'];

/** New-user onboarding — P0: a newly logged-in user NEVER enters the platform
 * with an empty role/skills state. Multi-step: profile basics → skills
 * (structured, selectable, DB-backed taxonomy) → research interests.
 * Completion persists server-side (users.onboarding_completed_at) — a
 * refresh never reopens it. */
export const OnboardingFlow: React.FC = () => {
  const { liveUser, setLiveUser, setOnboardingCompleted, enterDemo, logout } = useAuth();

  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1 — profile basics (prefilled from the profile)
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [designation, setDesignation] = useState('');
  const [institution, setInstitution] = useState('');
  const [initialized, setInitialized] = useState(false);

  const role = liveUser?.role ?? 'student';
  const isStudent = role === 'student';
  const isFacultyish = role === 'professor' || role === 'council_admin';

  // Seed the basics from the live profile
  useEffect(() => {
    if (!liveUser || initialized) return;
    setFullName(liveUser.name ?? '');
    setDepartment(liveUser.department ?? '');
    setInitialized(true);
  }, [liveUser, initialized]);

  // Load the DB-backed skill taxonomy + research topics
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Paginate the full taxonomy (the API paginates at 100/page — a
        // single page would hide skills past it, e.g. React/Python)
        const rows: SkillRow[] = [];
        let cursor: string | null = null;
        for (let i = 0; i < 5; i++) {
          const page = await apiFetch<{ data?: SkillRow[]; nextCursor?: string | null }>(
            `/skills?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
          );
          rows.push(...(page.data ?? []));
          cursor = page.nextCursor ?? null;
          if (!cursor) break;
        }
        if (!cancelled) setSkills(rows);
        const topicRows = await apiFetch<{ data?: TopicRow[] }>('/research-topics?limit=50').catch(() => ({ data: [] }));
        if (!cancelled) setTopics(topicRows.data ?? []);
      } catch {
        // taxonomy load failure — the flow still works with the basics
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prefill the selected skills from the profile's existing ones
  useEffect(() => {
    if (liveUser?.skills?.length && selectedSkillIds.length === 0) {
      const ids = skills
        .filter((s) => liveUser.skills.includes(s.name))
        .map((s) => s.id);
      setSelectedSkillIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills]);

  const groupedSkills = useMemo(() => {
    const term = skillSearch.toLowerCase().trim();
    const filtered = skills.filter((s) => !term || s.name.toLowerCase().includes(term));
    const groups: Record<string, SkillRow[]> = {};
    for (const s of filtered) {
      const cat = s.category || 'Other';
      (groups[cat] ??= []).push(s);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [skills, skillSearch]);

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const finish = async (explicit: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      // 1. Persist the profile basics
      const body: Record<string, unknown> = {};
      if (fullName.trim()) body.fullName = fullName.trim();
      if (department.trim()) body.department = department.trim();
      if (isStudent) {
        body.studentProfile = {
          ...(department.trim() ? { department: department.trim() } : {}),
          ...(course.trim() ? { course: course.trim() } : {}),
          ...(year ? { year: Number.parseInt(year, 10) } : {}),
        };
      }
      if (role === 'professor') {
        body.professorProfile = {
          ...(institution.trim() ? { institution: institution.trim() } : {}),
          ...(department.trim() ? { department: department.trim() } : {}),
          ...(designation.trim() ? { designation: designation.trim() } : {}),
        };
      }
      if (role === 'council_admin' && institution.trim()) {
        body.professorProfile = { institution: institution.trim() };
      }
      if (Object.keys(body).length > 0) {
        await apiFetch('/users/me/profile', { method: 'PATCH', body });
      }

      // 2. Persist the selected skills (the DB-backed taxonomy)
      for (const skillId of selectedSkillIds) {
        await apiFetch('/users/me/skills', {
          method: 'POST',
          body: { skillId },
        }).catch(() => undefined);
      }

      // 3. Persist the research interests (the existing user_research_topics)
      for (const topicId of selectedTopicIds) {
        await apiFetch('/users/me/interests', {
          method: 'POST',
          body: { topicId },
        }).catch(() => undefined);
      }

      // 4. Persist onboarding completion — a refresh never reopens it
      await apiFetch('/users/me/onboarding/complete', {
        method: 'POST',
        body: { completed: true },
      });

      setOnboardingCompleted(true);
    } catch {
      // the flow stays open — the user can retry
    } finally {
      setSaving(false);
    }
  };

  const selectedNames = skills
    .filter((s) => selectedSkillIds.includes(s.id))
    .map((s) => s.name);

  const inputCls =
    'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition';

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Set up your campus profile</span>
              <div className="text-[11px] text-zinc-500">Signed in as {liveUser?.email ?? '…'} · {role}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                    step >= s ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-500'
                  }`}
                >
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s === 1 && <div className={`h-0.5 flex-1 rounded ${step > 1 ? 'bg-zinc-900' : 'bg-zinc-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-7">
            {/* STEP 1 — basics */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-bold tracking-tight">Profile basics</h2>
                <p className="text-sm text-zinc-500 -mt-2">
                  Tell the network who you are — this powers discovery and recommendations.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Full name</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    {isFacultyish ? 'Department / Faculty' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science, Electronics, Mechanical"
                    className={inputCls}
                  />
                </div>

                {isStudent && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Degree / Program</label>
                      <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        placeholder="e.g. B.Tech CSE, BSc Physics"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Current year</label>
                      <select value={year} onChange={(e) => setYear(e.target.value)} className={inputCls}>
                        <option value="">Select…</option>
                        {['1', '2', '3', '4', '5'].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {role === 'professor' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Institution</label>
                      <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Associate Professor"
                        className={inputCls}
                      />
                    </div>
                  </div>
                )}

                {role === 'council_admin' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Organization / Council</label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. University Student Council"
                      className={inputCls}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <button onClick={logout} className="text-sm text-zinc-500 hover:text-zinc-900 transition">
                    Sign out
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!fullName.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Skills
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — skills + interests */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Your skills</h2>
                  <p className="text-sm text-zinc-500 -mt-2">
                    Select what you can do — search or browse by category.
                    {selectedSkillIds.length > 0 && (
                      <span className="font-semibold text-zinc-800"> {selectedSkillIds.length} selected.</span>
                    )}
                  </p>
                </div>

                {/* Selected chips */}
                {selectedNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                    {selectedNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => {
                          const row = skills.find((s) => s.name === name);
                          if (row) toggleSkill(row.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-zinc-900 text-white px-2 py-0.5 text-xs font-medium hover:bg-zinc-700 transition"
                      >
                        {name}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Search skills..."
                    className={`${inputCls} pl-9`}
                  />
                </div>

                {/* Categorized multi-select */}
                <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-200 divide-y divide-zinc-100">
                  {loadingData ? (
                    <div className="p-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading the skill taxonomy…
                    </div>
                  ) : (
                    groupedSkills.map(([cat, rows]) => (
                      <div key={cat} className="p-3.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">{cat}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {rows.map((s) => {
                            const on = selectedSkillIds.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                onClick={() => toggleSkill(s.id)}
                                className={`rounded-md px-2 py-0.5 text-xs font-medium border transition-colors ${
                                  on
                                    ? 'bg-zinc-900 text-white border-zinc-900'
                                    : 'bg-zinc-100/90 text-zinc-700 border-zinc-200/80 hover:bg-zinc-200/70'
                                }`}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Research interests (where appropriate) */}
                {topics.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold tracking-tight mb-1">Research interests <span className="text-zinc-400 font-normal text-xs">(optional)</span></h3>
                    <p className="text-xs text-zinc-500 mb-2">Pick topics you'd like to explore or contribute to.</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topics.slice(0, 24).map((t) => {
                        const id = t.researchTopic?.id ?? '';
                        const name = t.researchTopic?.name ?? '';
                        if (!id) return null;
                        const on = selectedTopicIds.includes(id);
                        return (
                          <button
                            key={id}
                            onClick={() => toggleTopic(id)}
                            className={`rounded-md px-2 py-0.5 text-xs font-medium border transition-colors ${
                              on
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <button onClick={() => setStep(1)} className="text-sm text-zinc-500 hover:text-zinc-900 transition">
                    Back
                  </button>
                  <button
                    onClick={() => finish(true)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-zinc-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Finish setup
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => finish(false)}
            disabled={saving}
            className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-900 transition py-2"
          >
            Skip for now — finish later from your profile
          </button>
        </div>
      </div>
    </div>
  );
};
