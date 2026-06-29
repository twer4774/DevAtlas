import type { ChangeLog } from '@/types'
import client from './client'

export const changelogApi = {
  list: (versionId: string) =>
    client.get<ChangeLog[]>(`/versions/${versionId}/changelog`).then((r) => r.data),
}
