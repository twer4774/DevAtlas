import axios from 'axios'

const TOKEN_KEY = 'devatlas-org-token'

// Capture token from URL query param (SSO handoff from Portal)
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  const urlToken = params.get('token')
  if (urlToken) {
    localStorage.setItem(TOKEN_KEY, urlToken)
    params.delete('token')
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState({}, '', newUrl)
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail ?? err.message
    return Promise.reject(new Error(message))
  }
)

export default client
