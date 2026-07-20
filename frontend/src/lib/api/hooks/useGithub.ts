import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "../keys";

export function useGithubRepos() {
  return useQuery({
    queryKey: queryKeys.github.repos(),
    queryFn: () => apiClient<any[]>("/github/repos"),
    staleTime: 1000 * 60 * 60, // 1 hour since repos don't change that often
  });
}
