import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/services/api/client";

interface NetworkUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  isUniversityVerified: boolean;
}

export default function NetworkPage(): JSX.Element {
  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiFetch<{ data?: NetworkUser[] }>("/users?role=student&limit=10")
      .then((d) => setUsers(d.data ?? []))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
      <h1 className="text-2xl font-semibold text-text-primary">Collaboration Network</h1>
      <p className="text-sm text-text-secondary">Visualization of connections across the university network.</p>
      {error && <p className="text-sm text-danger-600">Failed to load network data.</p>}
      <div className="rounded-lg border border-border bg-raised p-6">
        <div className="flex flex-wrap gap-3">
          {users.map((u) => (
            <Link key={u.id} to="/students" className="flex items-center gap-2 rounded-full bg-canvas px-3 py-1.5 text-sm text-text-primary shadow-sm border border-border hover:border-accent-500 transition-colors">
              <Users className="h-3.5 w-3.5 text-accent-600" />
              <span className="truncate max-w-[120px]">{u.username}</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-md bg-sunken text-sm text-text-secondary">
          Phase 8 — Network visualization: real DB nodes rendered (users from /api/v1/users). Graph edges (connections) reserved for Phase 9+.
        </div>
      </div>
    </div>
  );
}
