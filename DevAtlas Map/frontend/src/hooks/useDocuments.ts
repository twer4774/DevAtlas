import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/api/documents'

export const useNodeDocuments = (nodeId: string | null) =>
  useQuery({
    queryKey: ['documents', 'node', nodeId],
    queryFn: () => documentsApi.getByNode(nodeId!),
    enabled: !!nodeId,
  })

export const useVersionDocuments = (versionId: string | null) =>
  useQuery({
    queryKey: ['documents', 'version', versionId],
    queryFn: () => documentsApi.getByVersion(versionId!),
    enabled: !!versionId,
  })

export const useDocument = (id: string | null) =>
  useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.get(id!),
    enabled: !!id,
  })

export const useCreateDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export const useUpdateDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof documentsApi.update>[1]) =>
      documentsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

export const useDeleteDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}
