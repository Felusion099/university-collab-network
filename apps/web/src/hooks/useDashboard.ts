import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/api/dashboard";

export function useFeaturedProfile() {
  return useQuery({
    queryKey: ["dashboard-featured-profile"],
    queryFn: () => dashboardApi.getFeaturedProfile(),
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: () => dashboardApi.getRecentActivity(),
  });
}
