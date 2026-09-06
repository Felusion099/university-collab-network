import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SkillBadge / VerificationBadge — ARCHITECTURE.md §5 design-system
 * inventory (listed as two separate components; kept in one file since
 * they're both tiny pill primitives with no shared logic worth extracting
 * further — see PROJECT_SPEC's Anti-Crap Rule on not padding the component
 * count).
 */

export function SkillBadge({
  skill,
  className,
}: {
  skill: string;
  className?: string;
}): JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-700",
        className,
      )}
    >
      {skill}
    </span>
  );
}

/**
 * Mirrors `users.is_university_verified` (DATABASE_SCHEMA.md) — renders
 * nothing when false rather than a "not verified" pill, since a directory
 * full of negative badges is noisier than useful (Anti-Crap Rule).
 */
export function VerificationBadge({
  verified,
  className,
}: {
  verified: boolean;
  className?: string;
}): JSX.Element | null {
  if (!verified) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-600",
        className,
      )}
      title="University-verified"
    >
      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
      Verified
    </span>
  );
}
