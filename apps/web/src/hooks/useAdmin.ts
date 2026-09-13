import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Report, type AdminMetrics } from "@/services/api/admin";
import { useToastStore } from "@/stores/toast.store";

export function usePendingVerifications() {
  return useQuery({
    queryKey: ["admin-verifications", "pending"],
    queryFn: () => adminApi.getVerifications("pending"),
  });
}

export function useUpdateVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      adminApi.updateVerification(id, status),
    onSuccess: (result, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      if (result) {
        useToastStore
          .getState()
          .show(
            `Verification ${status} for ${result.data.userName}`,
            status === "approved" ? "success" : "default",
          );
      }
    },
  });
}

export function useOpenReports() {
  return useQuery<{ data: Report[] }>({
    queryKey: ["admin-reports", "open"],
    queryFn: () => adminApi.getOpenReports(),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: Report["action"] }) =>
      adminApi.updateReport(id, action),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      if (result) {
        useToastStore
          .getState()
          .show(`Report resolved: ${result.data.reportedName} (${result.data.action})`, "success");
      }
    },
  });
}

export function useAdminMetrics() {
  return useQuery<AdminMetrics>({
    queryKey: ["admin-metrics"],
    queryFn: () => adminApi.getMetrics(),
  });
}