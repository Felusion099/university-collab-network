import type { ReactNode } from "react";
import { VerificationBadge } from "@/components/ui/Badge";

/**
 * ProfileHeader — ARCHITECTURE.md §5. Extracted from what was inline
 * markup in `pages/_shared/DirectoryDetail.tsx` (the /students,
 * /professors, /researchers detail pages) — that inline block is exactly
 * what this component is for, so it's the first consumer, not a
 * speculative addition.
 */
export function ProfileHeader({
  avatarUrl,
  name,
  username,
  verified,
  subtitle,
  actions,
}: {
  avatarUrl: string | null;
  name: string;
  username?: string;
  verified?: boolean;
  subtitle?: string | null;
  actions?: ReactNode;
}): JSX.Element {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-lg font-semibold text-accent-700"
          >
            {initials}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
            {verified && <VerificationBadge verified />}
          </div>
          {username && <p className="text-sm text-text-secondary">@{username}</p>}
          {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}
