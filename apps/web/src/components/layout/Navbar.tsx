import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { useSessionStore } from "@/stores/session.store";
import { useLogout } from "@/hooks/useAuth";
import { SearchBar } from "@/components/SearchBar";

/**
 * Navbar — ARCHITECTURE.md §5. Replaces AppLayout's Phase 6 inline
 * `<header>` shell (see that file's history — Session 18 deliberately left
 * this for Phase 7, per its own objective).
 *
 * Only shows `email`/`role`/`status` because that's genuinely all
 * `AuthenticatedUser` (packages/shared-types/src/auth.ts) carries — no
 * `fullName`/`avatarUrl` here, so none is fabricated. A richer profile
 * summary needs `GET /users/me/profile` (API_CONTRACT.md §2), not yet
 * wired into any store; noted for Phase 8, not invented here.
 */
export function Navbar(): JSX.Element {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const user = useSessionStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <header className="flex items-center gap-4 border-b border-border bg-raised px-4 py-2.5 sm:px-6">
      <Link
        to="/dashboard"
        className="flex-shrink-0 whitespace-nowrap font-semibold text-text-primary"
      >
        UCN
      </Link>

      <SearchBar
        value=""
        onChange={(q) => {
          if (q.trim()) navigate(`/discover?q=${encodeURIComponent(q.trim())}`);
        }}
        className="hidden max-w-md flex-1 sm:block"
      />

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <span className="hidden max-w-[12rem] truncate text-sm text-text-secondary md:inline">
            {user.email}
          </span>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-sunken"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          onClick={() => logout.mutate()}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-sunken"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}
