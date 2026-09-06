import type { Visibility, PrivacySettings } from "@app/shared-types";
import { cn } from "@/lib/utils";

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "university_only", label: "University only" },
  { value: "connections_only", label: "Connections only" },
  { value: "private", label: "Private" },
];

const FIELD_LABELS: Record<keyof Omit<PrivacySettings, "userId">, string> = {
  profileVisibility: "Profile",
  emailVisibility: "Email address",
  phoneVisibility: "Phone number",
  academicVisibility: "Academic details",
  cgpaVisibility: "CGPA",
  projectsVisibility: "Projects",
  researchVisibility: "Research activity",
  socialLinksVisibility: "Social links",
  connectionsVisibility: "Connections list",
  activityVisibility: "Activity feed",
  contactVisibility: "Contact info",
};

/**
 * PrivacyControls — ARCHITECTURE.md §5. One dropdown per
 * `privacy_settings` column (DATABASE_SCHEMA.md — 11 fields, each the
 * same 4-value `Visibility` enum). Uses the real `PrivacySettings` type
 * from shared-types directly, not an invented shape.
 */
export function PrivacyControls({
  values,
  onChange,
  className,
}: {
  values: Omit<PrivacySettings, "userId">;
  onChange: (field: keyof Omit<PrivacySettings, "userId">, value: Visibility) => void;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("space-y-3", className)}>
      {(Object.keys(FIELD_LABELS) as (keyof Omit<PrivacySettings, "userId">)[]).map((field) => (
        <div key={field} className="flex items-center justify-between gap-4">
          <label htmlFor={`privacy-${field}`} className="text-sm text-text-primary">
            {FIELD_LABELS[field]}
          </label>
          <select
            id={`privacy-${field}`}
            value={values[field]}
            onChange={(e) => onChange(field, e.target.value as Visibility)}
            className="rounded-md border border-border bg-canvas px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
