import { useState } from "react";
import { ShieldAlert, ShieldCheck, Flag, BarChart3 } from "lucide-react";
import { useSessionStore } from "@/stores/session.store";
import {
  usePendingVerifications,
  useUpdateVerification,
  useOpenReports,
  useUpdateReport,
  useAdminMetrics,
} from "@/hooks/useAdmin";
import type { Report } from "@/services/api/admin";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";

/**
 * /admin — API_CONTRACT.md §9 (`requireRole(['admin'])` on every real
 * route). The check below is a UX convenience only — it hides the panel
 * for non-admins in this client — NOT a security boundary; that's
 * `requireRole` on the backend (ARCHITECTURE.md §5), which every mocked
 * call here would still need to pass once wired to a real endpoint.
 */
export default function AdminPage(): JSX.Element {
  const user = useSessionStore((s) => s.user);

  if (user?.role !== "admin") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Admins only"
        description="This page is only available to admin accounts."
      />
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-text-primary">Admin</h1>
      <MetricsSection />
      <VerificationsSection />
      <ReportsSection />
    </div>
  );
}

function MetricsSection(): JSX.Element {
  const { data: metrics, isLoading, isError, refetch } = useAdminMetrics();

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
        Metrics
      </h2>
      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key -- static skeleton count, never reordered
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}
      {isError && <ErrorState title="Couldn't load metrics" onRetry={() => refetch()} />}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(
            [
              ["Total users", metrics.totalUsers],
              ["Active (30d)", metrics.activeUsersLast30Days],
              ["Projects", metrics.projects],
              ["Research teams", metrics.researchTeams],
              ["Publications", metrics.publications],
              ["Organizations", metrics.organizations],
              ["Startups", metrics.startups],
              ["Collaborations formed", metrics.collaborationsFormed],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-border bg-raised p-3">
              <p className="text-2xl font-semibold text-text-primary">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function VerificationsSection(): JSX.Element {
  const { data: pending, isLoading, isError, refetch } = usePendingVerifications();
  const updateVerification = useUpdateVerification();

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Pending Verifications
      </h2>
      {isLoading && <Skeleton className="h-24 w-full rounded-lg" />}
      {isError && <ErrorState title="Couldn't load verifications" onRetry={() => refetch()} />}
      {pending && pending.length === 0 && (
        <p className="text-sm text-text-muted">Nothing pending review.</p>
      )}
      {pending && pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-raised p-3"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">{v.userName}</p>
                <p className="text-xs text-text-muted">
                  Requesting {v.requestedRole.replace("_", " ")} · {formatDate(v.submittedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateVerification.mutate({ id: v.id, status: "approved" })}
                  disabled={updateVerification.isPending}
                  className="rounded-md bg-success-100 px-3 py-1.5 text-xs font-medium text-success-600 hover:opacity-80 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => updateVerification.mutate({ id: v.id, status: "rejected" })}
                  disabled={updateVerification.isPending}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-sunken disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReportsSection(): JSX.Element {
  const { data: openReports, isLoading, isError, refetch } = useOpenReports();
  const updateReport = useUpdateReport();
  const [pendingConfirm, setPendingConfirm] = useState<{
    report: Report;
    action: "suspend" | "ban";
  } | null>(null);

  function handleAction(report: Report, action: Report["action"]): void {
    // "suspend"/"ban" are destructive account actions — confirm via Modal
    // (ARCHITECTURE.md §5) rather than applying on a single click. "none"/
    // "restrict" are reversible enough to apply immediately.
    if (action === "suspend" || action === "ban") {
      setPendingConfirm({ report, action });
      return;
    }
    updateReport.mutate({ id: report.id, action });
  }

  function confirmPendingAction(): void {
    if (!pendingConfirm) return;
    updateReport.mutate({ id: pendingConfirm.report.id, action: pendingConfirm.action });
    setPendingConfirm(null);
  }

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
        <Flag className="h-4 w-4" aria-hidden="true" />
        Open Reports
      </h2>
      {isLoading && <Skeleton className="h-24 w-full rounded-lg" />}
      {isError && <ErrorState title="Couldn't load reports" onRetry={() => refetch()} />}
      {openReports && openReports.length === 0 && (
        <p className="text-sm text-text-muted">No open reports.</p>
      )}
      {openReports && openReports.length > 0 && (
        <div className="space-y-2">
          {openReports.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-raised p-3">
              <p className="text-sm font-medium text-text-primary">{r.reportedName}</p>
              <p className="text-xs text-text-secondary">{r.reason}</p>
              <p className="mt-0.5 text-xs text-text-muted">{formatDate(r.submittedAt)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["none", "restrict", "suspend", "ban"] as const).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleAction(r, action)}
                    disabled={updateReport.isPending}
                    className="rounded-md border border-border px-2.5 py-1 text-xs capitalize text-text-primary hover:bg-sunken disabled:opacity-50"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={pendingConfirm !== null}
        onClose={() => setPendingConfirm(null)}
        title={`Confirm ${pendingConfirm?.action ?? ""}`}
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to {pendingConfirm?.action} {pendingConfirm?.report.reportedName}?
          This action affects their account access.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPendingConfirm(null)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-sunken"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmPendingAction}
            className="rounded-md bg-danger-600 px-3 py-1.5 text-sm font-medium text-text-onAccent hover:opacity-90"
          >
            Confirm
          </button>
        </div>
      </Modal>
    </section>
  );
}
