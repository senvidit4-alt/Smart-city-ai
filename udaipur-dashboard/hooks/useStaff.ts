import { useQuery } from "@tanstack/react-query";
import { fetchStaff } from "@/lib/api";

export function useStaff(params: { day?: string; department?: string } = {}) {
  return useQuery({
    queryKey: ["staff", params],
    queryFn: () => fetchStaff(params),
    staleTime: 5 * 60 * 1000,
  });
}
