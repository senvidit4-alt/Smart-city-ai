import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/api";

export function useEvents(upcoming = true) {
  return useQuery({
    queryKey: ["events", upcoming],
    queryFn: () => fetchEvents(upcoming),
    staleTime: 5 * 60 * 1000,
  });
}
