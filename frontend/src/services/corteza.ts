import type { TicketDateValue, TicketRecord } from '../types/ticket'

const API_BASE = (import.meta.env.VITE_CORTEZA_API_URL || 'http://localhost:18080').replace(/\/$/, '')
const MODULE_ID = (import.meta.env.VITE_CORTEZA_MODULE_ID || '')

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
  // Normalize different possible shapes returned by Corteza
  const payload = input?.record || input?.data || input || {}
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

async function tryEndpointsForList(candidates: string[]) {
  let lastErr: any = null
  for (const p of candidates) {
    try {
      const res = await request<any>(p)
      if (Array.isArray(res) || res?.data) return res
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error('No working list endpoint found')
}

export const cortezaService = {
  async listTickets(): Promise<TicketRecord[]> {
    if (!MODULE_ID) throw new Error('VITE_CORTEZA_MODULE_ID is not set')

    const candidates = [
      `/api/records?module=${MODULE_ID}`,
      `/api/compose/records?module=${MODULE_ID}`,
      `/api/module/records?module=${MODULE_ID}`,
      `/api/records?moduleName=${encodeURIComponent('Support Ticket')}`
    ]

    const payload = await tryEndpointsForList(candidates)
    const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : payload?.data || []
    return rows.map(toTicketRecord)
  },

  async createTicket(payload: Partial<TicketRecord>): Promise<TicketRecord> {
    if (!MODULE_ID) throw new Error('VITE_CORTEZA_MODULE_ID is not set')
    const normalizedPayload = {
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
    }

    const candidates = [
      `/api/records`,
      `/api/compose/records`,
      `/api/records?module=${MODULE_ID}`
    ]

    let lastErr: any = null
    for (const p of candidates) {
      try {
        const resp = await request<any>(p, {
          method: 'POST',
          body: JSON.stringify(normalizedPayload)
        })
        return toTicketRecord(resp?.record || resp)
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr || new Error('Create failed for all candidate endpoints')
  },

  async updateTicket(id: string, payload: Partial<TicketRecord>): Promise<TicketRecord> {
    const normalizedPayload = {
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
    }

    const candidates = [
      `/api/records/${id}`,
      `/api/compose/records/${id}`
    ]

    let lastErr: any = null
    for (const p of candidates) {
      try {
        const resp = await request<any>(p, {
          method: 'PATCH',
          body: JSON.stringify(normalizedPayload)
        })
        return toTicketRecord(resp?.record || resp)
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr || new Error('Update failed for all candidate endpoints')
  },

  async deleteTicket(id: string): Promise<void> {
    const candidates = [`/api/records/${id}`, `/api/compose/records/${id}`]
    let lastErr: any = null
    for (const p of candidates) {
      try {
        await request<any>(p, { method: 'DELETE' })
        return
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr || new Error('Delete failed for all candidate endpoints')
  }
}
