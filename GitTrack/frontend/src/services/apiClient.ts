import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

const PORTAL_TOKEN_KEY = 'devatlas-org-token'

// Capture Portal token from URL query param on init
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  const urlToken = params.get('token')
  if (urlToken) {
    localStorage.setItem(PORTAL_TOKEN_KEY, urlToken)
    params.delete('token')
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState({}, '', newUrl)
  }
}

export function getPortalToken(): string | null {
  return localStorage.getItem(PORTAL_TOKEN_KEY)
}

export function clearPortalToken(): void {
  localStorage.removeItem(PORTAL_TOKEN_KEY)
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.client.interceptors.request.use((config) => {
      const portalToken = localStorage.getItem(PORTAL_TOKEN_KEY)
      const token = portalToken || localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const portalToken = localStorage.getItem(PORTAL_TOKEN_KEY)
          if (portalToken) {
            localStorage.removeItem(PORTAL_TOKEN_KEY)
            window.location.href = 'http://localhost:5174/login'
          } else {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config)
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }
}

export const apiClient = new ApiClient()
