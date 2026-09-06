import { cn } from "@/lib/utils";

export interface FilterGroup {
  label: string;
  key: string;
  options: { value: string; label: string }[];
}

/**
 * FilterPanel — ARCHITECTURE.md §5. Generic single-select-per-group
 * filter sidebar. Not yet wired into any list page this session (every
 * list page so far only filters via its SearchBar) — built so the next
 * session can add filtering to /students, /projects, etc. without
 * inventing this component fresh. `activeValues`/`onChange` are keyed by
 * group `key` so one panel instance can hold several independent filters.
 */
export function FilterPanel({
  groups,
  activeValues,
  onChange,
  className,
}: {
  groups: FilterGroup[];
  activeValues: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn("space-y-5", className)}>
      {groups.map((group) => (
        <div key={group.key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {group.label}
          </h3>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onChange(group.key, undefined)}
              className={cn(
                "rounded-md px-2 py-1 text-left text-sm transition-colors",
                activeValues[group.key] === undefined
                  ? "bg-accent-100 text-accent-700"
                  : "text-text-secondary hover:bg-sunken",
              )}
            >
              All
            </button>
            {group.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(group.key, option.value)}
                className={cn(
                  "rounded-md px-2 py-1 text-left text-sm transition-colors",
                  activeValues[group.key] === option.value
                    ? "bg-accent-100 text-accent-700"
                    : "text-text-secondary hover:bg-sunken",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
