import { NavLink } from "react-router-dom";
import { LayoutDashboard, Compass, FolderKanban, MessageSquare, IdCard } from "lucide-react";
import { useSessionStore } from "@/stores/session.store";
import { cn } from "@/lib/utils";

/**
 * MobileBottomNav — the spec's mobile primary navigation (01 §6: Home,
 * Discover, Projects, Messages, Profile; 03 §2 AppShell: compact header +
 * one-column content + stable bottom nav). The desktop Sidebar remains the
 * desktop primary nav — one nav per breakpoint, not competing systems.
 * Active state is NOT color-only: the accent pill + weight change
 * communicate location (06 §5 color independence). Touch targets ≥44px
 * (06 §11).
 */
const MOBILE_NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/me", label: "Profile", icon: IdCard },
] as const;

export function MobileBottomNav({ className }: { className?: string }): JSX.Element {
  const status = useSessionStore((s) => s.status);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "z-sticky fixed inset-x-0 bottom-0 flex items-stretch justify-around border-t border-border bg-raised md:hidden",
        className,
      )}
    >
      {status === "authenticated" ? (
        MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "rounded-lg bg-accent-100 text-accent-700"
                  : "text-text-secondary hover:text-text-primary",
              )
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))
      ) : (
        <NavLink
          to="/login"
          className={({ isActive }) =>
            cn(
              "flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center text-sm font-medium transition-colors",
              isActive ? "text-accent-700" : "text-text-secondary",
            )
          }
        >
          Log in
        </NavLink>
      )}
    </nav>
  );
}
