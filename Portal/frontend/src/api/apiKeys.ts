import client from './client'

export interface ApiKeyOut {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export interface ApiKeyCreated extends ApiKeyOut {
  key: string
}

export const listApiKeys = (): Promise<ApiKeyOut[]> =>
  client.get('/api-keys').then(r => r.data)

export const createApiKey = (name: string): Promise<ApiKeyCreated> =>
  client.post('/api-keys', { name }).then(r => r.data)

export const revokeApiKey = (id: string): Promise<void> =>
  client.delete(`/api-keys/${id}`).then(r => r.data)

export const createServiceToken = (id: string, orgSlug: string): Promise<{ service_token: string; org_slug: string }> =>
  client.post(`/api-keys/${id}/service-token`, { org_slug: orgSlug }).then(r => r.data)
