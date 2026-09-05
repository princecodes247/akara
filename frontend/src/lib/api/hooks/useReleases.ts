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

export function useUpdateReleaseMapping(projectId: string, defaultReleaseId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      const targetReleaseId = data._releaseId || defaultReleaseId;
      const payload = { ...data };
      delete payload._releaseId;
      
      return apiClient<any>(`/projects/${projectId}/releases/${targetReleaseId}/mapping`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onMutate: async (data: any) => {
      const targetReleaseId = data._releaseId || defaultReleaseId;
      await queryClient.cancelQueries({ queryKey: queryKeys.releases.list(projectId) });
      const previousReleases = queryClient.getQueryData<any[]>(queryKeys.releases.list(projectId));

      if (previousReleases) {
        queryClient.setQueryData(queryKeys.releases.list(projectId), (old: any[]) => {
          if (!old) return old;
          return old.map(rel => {
            // Update the target release
            if (rel.id.toString() === targetReleaseId?.toString()) {
              const updated = { ...rel };
              if (data.status !== undefined) updated.status = data.status;
              if (data.isCurrent !== undefined) updated.isCurrent = data.isCurrent;
              return updated;
            }
            // If setting a new current release, unset others
            if (data.isCurrent) {
              return { ...rel, isCurrent: false };
            }
            return rel;
          });
        });
      }

      return { previousReleases };
    },
    onError: (err, newRelease, context) => {
      if (context?.previousReleases) {
        queryClient.setQueryData(queryKeys.releases.list(projectId), context.previousReleases);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.releases.list(projectId) });
    },
  });
}

export function useDeleteReleaseMapping(projectId: string, defaultReleaseId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetReleaseId?: string) => {
      const idToUse = targetReleaseId || defaultReleaseId;
      return apiClient<any>(`/projects/${projectId}/releases/${idToUse}/mapping`, {
        method: "DELETE",
      });
    },
    onMutate: async (targetReleaseId?: string) => {
      const idToUse = targetReleaseId || defaultReleaseId;
      await queryClient.cancelQueries({ queryKey: queryKeys.releases.list(projectId) });
      const previousReleases = queryClient.getQueryData<any[]>(queryKeys.releases.list(projectId));

      if (previousReleases) {
        queryClient.setQueryData(queryKeys.releases.list(projectId), (old: any[]) => {
          if (!old) return old;
          return old.map(rel => {
            if (rel.id.toString() === idToUse?.toString()) {
              // Revert to raw artifact state
              return { 
                ...rel, 
                status: "draft", 
                isCurrent: false, 
                customTitle: undefined, 
                customBody: undefined, 
                customAssets: undefined 
              };
            }
            return rel;
          });
        });
      }

      return { previousReleases };
    },
    onError: (err, variables, context) => {
      if (context?.previousReleases) {
        queryClient.setQueryData(queryKeys.releases.list(projectId), context.previousReleases);
      }
    },
    onSettled: () => {
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

export function useAutoDetectSignatures(projectId: string, releaseId: string) {
  return useMutation({
    mutationFn: () =>
      apiClient<{
        signatures: Array<{
          assetId?: string | number;
          assetName: string;
          tag: string;
          signature: string;
          source: string;
        }>;
        latestJson?: any;
      }>(`/projects/${projectId}/releases/${releaseId}/auto-signatures`),
  });
}
