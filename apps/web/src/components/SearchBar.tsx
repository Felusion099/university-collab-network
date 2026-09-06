import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SearchBar — ARCHITECTURE.md §5. Debounced 300ms per ARCHITECTURE.md §4
 * ("Debounced on the frontend (300ms)") — that number isn't arbitrary
 * here, it's the documented contract for how Discover/Search are meant
 * to feel, so it's hardcoded to match rather than left as a prop default
 * someone could silently drift away from.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search people, projects, research...",
  autoFocus = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}): JSX.Element {
  const [draft, setDraft] = useState(value);

  // Keep local draft in sync if the parent resets `value` externally
  // (e.g. a "clear filters" action elsewhere on the page).
  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (draft !== value) onChange(draft);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally excludes `value`/`onChange`: this effect debounces `draft`, re-running it on every parent-driven `value` change would cancel the user's own typing.
  }, [draft]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        role="searchbox"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={placeholder}
        className="w-full rounded-md border border-border bg-canvas py-2 pl-9 pr-9 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
