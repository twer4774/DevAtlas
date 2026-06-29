function baseUrl(): string {
  const b = process.env.DEVATLAS_API_BASE ?? `http://127.0.0.1:8000`
  return b.replace(/\/$/, '')
}

function authHeaders(): Record<string, string> {
  const t = process.env.DEVATLAS_API_TOKEN ?? process.env.DEVATLAS_API_KEY
  const h: Record<string, string> = {}
  if (t) h.Authorization = `Bearer ${t}`
  return h
}

export async function devatlasRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const url = `${baseUrl()}${path.startsWith(`/`) ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  headers.set(`Accept`, `application/json`)
  const auth = authHeaders()
  Object.entries(auth).forEach(([k, v]) => headers.set(k, v))
  if (
    init.body !== undefined &&
    !(init.body instanceof FormData) &&
    !headers.has(`Content-Type`)
  ) {
    headers.set(`Content-Type`, `application/json`)
  }
  return fetch(url, { ...init, headers })
}

export async function apiErrorBody(res: Response): Promise<string> {
  try {
    const text = await res.text()
    if (!text.trim()) return res.statusText || `HTTP ${res.status}`
    try {
      const j = JSON.parse(text) as { detail?: unknown }
      const d = j.detail
      if (typeof d === `string`) return d
      if (Array.isArray(d))
        return d.map((x) => (typeof x === `object` && x && `msg` in x ? String((x as { msg: unknown }).msg) : JSON.stringify(x))).join(`; `)
      return text.slice(0, 2000)
    } catch {
      return text.slice(0, 2000)
    }
  } catch {
    return res.statusText || `HTTP ${res.status}`
  }
}
