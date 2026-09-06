import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  GraduationCap,
  Presentation,
  FlaskConical,
  Users2,
  FolderKanban,
  BookOpen,
  Rocket,
  CalendarDays,
  Briefcase,
  MessageSquare,
  Bell,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useSessionStore } from "@/stores/session.store";
import { cn } from "@/lib/utils";

/**
 * Sidebar — ARCHITECTURE.md §5. Only links to routes that actually exist
 * (see IMPLEMENTATION_STATUS.md's Phase 7 notes for exactly what's
 * built). "Admin" only renders for `role === "admin"` — same UX-only gate
 * as AdminPage.tsx itself; real enforcement is the backend's
 * `requireRole`.
 */
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/students", label: "Students", icon: GraduationCap },
  { to: "/professors", label: "Professors", icon: Presentation },
  { to: "/researchers", label: "Researchers", icon: FlaskConical },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/research-teams", label: "Research Teams", icon: Users2 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/publications", label: "Publications", icon: BookOpen },
  { to: "/clubs", label: "Clubs & Societies", icon: Users2 },
  { to: "/startups", label: "Startups", icon: Rocket },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/opportunities", label: "Opportunities", icon: Briefcase },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar({ className }: { className?: string }): JSX.Element {
  const isAdmin = useSessionStore((s) => s.user?.role === "admin");

  return (
    <nav
      aria-label="Main"
      className={cn("flex flex-col gap-1 overflow-y-auto border-r border-border bg-raised p-3", className)}
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent-100 text-accent-700"
                : "text-text-secondary hover:bg-sunken hover:text-text-primary",
            )
          }
        >
          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
      {isAdmin && (
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent-100 text-accent-700"
                : "text-text-secondary hover:bg-sunken hover:text-text-primary",
            )
          }
        >
          <ShieldCheck className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          Admin
        </NavLink>
      )}
    </nav>
  );
}
