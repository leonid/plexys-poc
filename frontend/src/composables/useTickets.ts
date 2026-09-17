import { ref, computed } from 'vue'
import { cortezaService } from '../services/corteza'
import type { TicketFormValues, TicketRecord } from '../types/ticket'

function normalizeFormPayload(values: TicketFormValues) {
  return {
    subject: values.subject,
    description: values.description,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate ? values.dueDate.toISOString() : null
  }
}

export function useTickets() {
  const tickets = ref<TicketRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const statusOptions = ['New', 'In Progress', 'Resolved', 'Closed']
  const priorityOptions = ['Low', 'Medium', 'High', 'Urgent']

  const ticketSummary = computed(() => ({
    total: tickets.value.length,
    open: tickets.value.filter((ticket) => ticket.status !== 'Closed' && ticket.status !== 'Resolved').length
  }))

  async function load() {
    loading.value = true
    error.value = null

    try {
      tickets.value = await cortezaService.listTickets()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load tickets.'
      tickets.value = []
    } finally {
      loading.value = false
    }
  }

  async function create(values: TicketFormValues) {
    const payload: Partial<TicketRecord> = normalizeFormPayload(values)

    const created = await cortezaService.createTicket(payload)
    tickets.value = [created, ...tickets.value]
    return created
  }

  async function update(id: string, values: TicketFormValues) {
    const payload: Partial<TicketRecord> = normalizeFormPayload(values)

    const updated = await cortezaService.updateTicket(id, payload)
    tickets.value = tickets.value.map((ticket) => (ticket.id === id ? { ...ticket, ...updated } : ticket))
    return updated
  }

  async function remove(id: string) {
    await cortezaService.deleteTicket(id)
    tickets.value = tickets.value.filter((ticket) => ticket.id !== id)
  }

  return {
    tickets,
    loading,
    error,
    statusOptions,
    priorityOptions,
    ticketSummary,
    load,
    create,
    update,
    remove
  }
}
