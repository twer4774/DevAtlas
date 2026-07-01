import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roadmapApi, type RoadmapItemCreate, type RoadmapItemUpdate } from '@/api/roadmap'

export const useRoadmap = (projectId: string | null, versionId?: string | null) =>
  useQuery({
    queryKey: ['roadmap', projectId, versionId ?? null],
    queryFn: () => roadmapApi.list(projectId!, versionId),
    enabled: !!projectId,
    staleTime: 0,
    refetchInterval: 10_000,
  })

export const useCreateRoadmapItem = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RoadmapItemCreate) => roadmapApi.create(projectId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap', projectId] }),
  })
}

export const useUpdateRoadmapItem = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & RoadmapItemUpdate) => roadmapApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap', projectId] }),
  })
}

export const useDeleteRoadmapItem = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => roadmapApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmap', projectId] }),
  })
}
