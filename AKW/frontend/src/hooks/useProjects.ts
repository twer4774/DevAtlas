import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'

export const useProjects = () =>
  useQuery({ queryKey: ['projects'], queryFn: projectsApi.list })

export const useProject = (id: string | null) =>
  useQuery({ queryKey: ['projects', id], queryFn: () => projectsApi.get(id!), enabled: !!id })

export const useCreateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export const useDeleteProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}
