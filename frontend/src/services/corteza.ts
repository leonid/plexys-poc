import type { TicketDateValue, TicketRecord } from '../types/ticket'

const API_BASE = (import.meta.env.VITE_CORTEZA_API_URL || 'http://localhost:18080').replace(/\/$/, '')
const NAMESPACE_ID = (import.meta.env.VITE_CORTEZA_NAMESPACE_ID || '')
const MODULE_ID = (import.meta.env.VITE_CORTEZA_MODULE_ID || '')

function ensureNamespaceAndModule() {
  if (!NAMESPACE_ID) throw new Error('VITE_CORTEZA_NAMESPACE_ID is not set')
  if (!MODULE_ID) throw new Error('VITE_CORTEZA_MODULE_ID is not set')
}

function composeBasePath() {
  ensureNamespaceAndModule()
  return `/compose/namespace/${NAMESPACE_ID}/module/${MODULE_ID}`
}

function normalizeDueDate(value: TicketDateValue | Date | null): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const TOKEN_STORAGE_KEY = 'corteza_auth_token'

export function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href)
      const tokenFromQuery = url.searchParams.get('token') || url.searchParams.get('access_token')
      if (tokenFromQuery) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenFromQuery)
        url.searchParams.delete('token')
        url.searchParams.delete('access_token')
        window.history.replaceState({}, document.title, url.pathname + url.search)
        return tokenFromQuery
      }

      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''))
        const tokenFromHash = hashParams.get('access_token') || hashParams.get('token')
        if (tokenFromHash) {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, tokenFromHash)
          window.location.hash = ''
          return tokenFromHash
        }
      }

      const sessionToken = sessionStorage.getItem(TOKEN_STORAGE_KEY)
      if (sessionToken) return sessionToken

      const localToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (localToken) return localToken
    } catch {
      // Storage access may fail in sandboxed iframes
    }
  }

  return (import.meta.env.VITE_CORTEZA_JWT as string) || ''
}

export function setAuthToken(token: string, persist = true): void {
  if (typeof window !== 'undefined') {
    try {
      if (token.trim()) {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token.trim())
        if (persist) {
          localStorage.setItem(TOKEN_STORAGE_KEY, token.trim())
        }
      } else {
        sessionStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    } catch {
      // Ignore storage errors
    }
  }
}

export function clearAuthToken(): void {
  setAuthToken('', false)
}

function getHeaders() {
  const csrfToken = typeof document !== 'undefined'
    ? document.cookie
        .split('; ')
        .find((row) => row.startsWith('CortezaCSRF='))
        ?.split('=')[1]
    : undefined

  const jwt = getAuthToken()

  return {
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
  }
}

function toTicketRecord(input: any): TicketRecord {
  const payload = input?.record || input || {}

  const values = Array.isArray(payload.values)
      ? Object.fromEntries(
          payload.values.map((item: any) => [
            item.name,
            item.value,
          ])
      )
      : payload.values || {}

  return {
    id: payload.recordID || payload.id || payload.record_id,

    subject: values.subject ?? '',

    description: values.description ?? '',

    status: values.status ?? 'New',

    priority: values.priority ?? 'Medium',

    dueDate:
        values.dueDate ??
        values['due-date'] ??
        values.due_date ??
        null,

    createdAt:
        payload.createdAt ??
        payload.created_at,

    updatedAt:
        payload.updatedAt ??
        payload.updated_at,

    owner:
        payload.owner ??
        payload.createdBy,
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const response = await fetch(url, {
    credentials: 'include',
    headers: getHeaders(),
    ...init
  })

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/html')) {
    throw new Error('Corteza returned an authentication redirect or HTML error. Please ensure a valid OAuth Bearer JWT is provided via session or environment.');
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  const text = await response.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch (err) {
    throw new Error('Failed to parse JSON response: ' + err)
  }
}

export function getJwtUserId(): string | null {
  const jwt = getAuthToken()
  if (!jwt) return null
  try {
    const parts = jwt.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64)
    const payload = JSON.parse(decoded)
    return payload.sub || null
  } catch {
    return null
  }
}

function buildRecordValues(payload: Partial<TicketRecord>) {
  return [
    { name: 'subject', value: payload.subject ?? '' },
    { name: 'description', value: payload.description ?? '' },
    { name: 'status', value: payload.status ?? 'New' },
    { name: 'priority', value: payload.priority ?? 'Medium' },
    {
      name: 'due-date',
      value: normalizeDueDate(payload.dueDate ?? null)
    }
  ]
}

export const cortezaService = {
  async listTickets(): Promise<TicketRecord[]> {
    ensureNamespaceAndModule()
    const paths = [
      `${composeBasePath()}/record`,
      `/api${composeBasePath()}/record/?summaries=[]&query=&deleted=0&limit=14&incTotal=true&incPageNavigation=true&sort=createdAt+DESC`
    ]

    let lastErr: any = null
    for (const path of paths) {
      try {
        const res = await request<any>(path)
        // some Corteza Compose responses wrap records under response.set
        const rows = res?.response?.set || res?.data || (Array.isArray(res) ? res : null) || res?.set || []
        return (Array.isArray(rows) ? rows : []).map(toTicketRecord)
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr || new Error('No working list endpoint found')
  },

  async createTicket(payload: Partial<TicketRecord>): Promise<TicketRecord> {
    ensureNamespaceAndModule()
    const currentUserId = getJwtUserId()
    const recordPayload: Record<string, any> = {
      meta: {},
      values: buildRecordValues(payload)
    }

    if (currentUserId) {
      recordPayload.ownedBy = currentUserId
    }

    const body = JSON.stringify(recordPayload)

    const resp = await request<any>(
      `/api${composeBasePath()}/record/`,
      {
        method: 'POST',
        body
      }
    )

    return toTicketRecord(resp?.record || resp)
  },

  async updateTicket(id: string, payload: Partial<TicketRecord>): Promise<TicketRecord> {
    ensureNamespaceAndModule()
    const paths = [
      `${composeBasePath()}/record/${id}`,
      `/api${composeBasePath()}/record/${id}`
    ]

    const body = JSON.stringify({

        // moduleID: MODULE_ID,
        // recordID: id,
      query: `recordID = ${id}`,
        values: buildRecordValues({
          subject: payload.subject,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          dueDate: normalizeDueDate(payload.dueDate ?? null)
        })
    })

    const resp = await request<any>(
      `/api${composeBasePath()}/record/`,
      {
        method: 'PATCH',
        body
      }
    )

    return toTicketRecord(resp?.record || resp)
  },

  async deleteTicket(id: string): Promise<void> {
    ensureNamespaceAndModule()
    const paths = [
      `${composeBasePath()}/record/${id}`,
      `/api${composeBasePath()}/record/${id}`
    ]

    let lastErr: any = null
    for (const path of paths) {
      try {
        await request<any>(path, { method: 'DELETE' })
        return
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr || new Error('Delete failed for all candidate endpoints')
  }
}
