export type TicketStatus = 'New' | 'In Progress' | 'Resolved' | 'Closed'
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type TicketDateValue = string | null

export interface TicketRecord {
  id?: string
  subject: string
  description?: string
  status: TicketStatus
  priority: TicketPriority
  dueDate?: TicketDateValue
  createdAt?: string
  updatedAt?: string
  owner?: string
}

export interface TicketFormValues {
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  dueDate: Date | null
}
