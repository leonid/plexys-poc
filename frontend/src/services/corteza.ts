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

function getHeaders() {
  const csrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('CortezaCSRF='))
    ?.split('=')[1]

  return {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
  }
}

function toTicketRecord(input: any): TicketRecord {
  const payload = input?.record || input || {}
  const values = payload?.values || payload

  return {
    id: payload?.recordID || payload?.id || payload?.record_id || values?.ID || values?.id,
    subject: values?.subject || payload?.subject || '',
    description: values?.description || payload?.description || '',
    status: values?.status || payload?.status || 'New',
    priority: values?.priority || payload?.priority || 'Medium',
    dueDate: values?.dueDate || values?.due_date || payload?.dueDate || payload?.due_date || null,
    createdAt: payload?.createdAt || payload?.created_at || values?.createdAt,
    updatedAt: payload?.updatedAt || payload?.updated_at || values?.updatedAt,
    owner: payload?.owner || values?.owner || payload?.createdBy
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const response = await fetch(url, {
    credentials: 'include',
    headers: getHeaders(),
    ...init
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed: ${response.status}`)
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export const cortezaService = {
  async listTickets(): Promise<TicketRecord[]> {
    ensureNamespaceAndModule()
    const path = `${composeBasePath()}/record`
    const res = await request<any>(path)
    // Corteza may return { data: [...] } or an array
    const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : res?.data || []
    return rows.map(toTicketRecord)
  },

  async createTicket(payload: Partial<TicketRecord>): Promise<TicketRecord> {
    ensureNamespaceAndModule()
    const path = `${composeBasePath()}/record`
    const body = JSON.stringify({
      record: {
        moduleID: MODULE_ID,
        values: {
          subject: payload.subject,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          dueDate: normalizeDueDate(payload.dueDate ?? null)
        }
      }
    })

    const resp = await request<any>(path, { method: 'POST', body })
    return toTicketRecord(resp?.record || resp)
  },

  async updateTicket(id: string, payload: Partial<TicketRecord>): Promise<TicketRecord> {
    ensureNamespaceAndModule()
    const path = `${composeBasePath()}/record/${id}`
    const body = JSON.stringify({
      record: {
        moduleID: MODULE_ID,
        recordID: id,
        values: {
          subject: payload.subject,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          dueDate: normalizeDueDate(payload.dueDate ?? null)
        }
      }
    })

    const resp = await request<any>(path, { method: 'PATCH', body })
    return toTicketRecord(resp?.record || resp)
  },

  async deleteTicket(id: string): Promise<void> {
    ensureNamespaceAndModule()
    const path = `${composeBasePath()}/record/${id}`
    await request<any>(path, { method: 'DELETE' })
  }
}
