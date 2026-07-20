import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "../keys";

export function useReleases(projectId: string) {
  return useQuery({
    queryKey: queryKeys.releases.list(projectId),
    queryFn: () => apiClient<any[]>(`/projects/${projectId}/releases`),
    enabled: !!projectId,
  });
}

export function useUpdateReleaseMapping(projectId: string, releaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiClient<any>(`/projects/${projectId}/releases/${releaseId}/mapping`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.list(projectId) });
    },
  });
}

export function useDeleteReleaseMapping(projectId: string, releaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<any>(`/projects/${projectId}/releases/${releaseId}/mapping`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.list(projectId) });
    },
  });
}

export function useSyncReleaseAssets(projectId: string, releaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<any>(`/projects/${projectId}/releases/${releaseId}/sync`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.list(projectId) });
    },
  });
}
