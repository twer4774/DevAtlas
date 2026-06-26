import client from './client'

export const listOrgs = () => client.get('/orgs').then(r => r.data)
export const createOrg = (name: string, slug: string) => client.post('/orgs', { name, slug }).then(r => r.data)
export const getOrgToken = (slug: string) => client.post(`/orgs/${slug}/token`).then(r => r.data)
export const listMembers = (slug: string) => client.get(`/orgs/${slug}/members`).then(r => r.data)
export const inviteMember = (slug: string, github_username: string, email: string, role: string) =>
  client.post(`/orgs/${slug}/invitations`, {
    github_username: github_username || undefined,
    email: email || undefined,
    role,
  }).then(r => r.data)
export const removeMember = (slug: string, userId: string) => client.delete(`/orgs/${slug}/members/${userId}`)
export const acceptInvite = (token: string) => client.post(`/orgs/invitations/${token}/accept`).then(r => r.data)
