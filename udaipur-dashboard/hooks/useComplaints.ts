import { useQuery } from "@tanstack/react-query";
import { fetchComplaints } from "@/lib/api";

export function useComplaints(params: {
  ward?: string;
  type?: string;
  days?: number;
} = {}) {
  return useQuery({
    queryKey: ["complaints", params],
    queryFn: () => fetchComplaints(params),
    staleTime: 2 * 60 * 1000,
  });
}
