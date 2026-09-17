import type { TicketDateValue, TicketRecord } from '../types/ticket'

const API_BASE = (import.meta.env.VITE_CORTEZA_API_URL || 'http://localhost:18080/api').replace(/\/$/, '')

export interface CortezaListResponse {
  data: TicketRecord[]
  meta?: { total?: number }
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
  return {
    id: input?.recordID || input?.id || input?.record_id,
    subject: input?.subject || '',
    description: input?.description || '',
    status: input?.status || 'New',
    priority: input?.priority || 'Medium',
    dueDate: input?.dueDate || input?.due_date || null,
    createdAt: input?.createdAt || input?.created_at,
    updatedAt: input?.updatedAt || input?.updated_at,
    owner: input?.owner || input?.createdBy || input?.ownerID
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
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
    const payload = await request<any>(`/module/records?module=Support Ticket`)
    const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []
    return rows.map(toTicketRecord)
  },

  async createTicket(payload: Partial<TicketRecord>): Promise<TicketRecord> {
    const normalizedPayload = {
      ...payload,
      dueDate: normalizeDueDate(payload.dueDate ?? null)
    }

    const response = await request<any>('/records', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(normalizedPayload)
    })
    return toTicketRecord(response?.record || response)
  },

  async updateTicket(id: string, payload: Partial<TicketRecord>): Promise<TicketRecord> {
    const normalizedPayload = {
      ...payload,
      dueDate: normalizeDueDate(payload.dueDate ?? null)
    }

    const response = await request<any>(`/records/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(normalizedPayload)
    })
    return toTicketRecord(response?.record || response)
  },

  async deleteTicket(id: string): Promise<void> {
    await request<any>(`/records/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
  }
}
