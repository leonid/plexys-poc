<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import type { TicketRecord } from '../types/ticket'
import type { CustomerRecord } from '../types/customer'

const props = defineProps<{
  tickets: TicketRecord[]
  customers?: CustomerRecord[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', ticket: TicketRecord): void
  (e: 'delete', ticket: TicketRecord): void
}>()

function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) return '—'
  const d = new Date(dateValue)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function resolveCustomer(ticket: TicketRecord): string {
  if (ticket.customerName) return ticket.customerName
  if (!ticket.customerId) return '—'
  const found = props.customers?.find((c) => c.id === ticket.customerId)
  if (!found) return ticket.customerId
  return found.company ? `${found.name} (${found.company})` : found.name
}
</script>

<template>
  <DataTable :value="tickets" striped-rows responsive-layout="scroll" :loading="loading">
    <template #empty>
      <div class="empty-state">No support tickets found.</div>
    </template>

    <Column field="subject" header="Subject" />
    <Column header="Customer">
      <template #body="slotProps">
        <span v-if="slotProps.data.customerId || slotProps.data.customerName" class="customer-badge">
          <i class="pi pi-building"></i>
          {{ resolveCustomer(slotProps.data) }}
        </span>
        <span v-else class="unassigned-text">—</span>
      </template>
    </Column>
    <Column field="status" header="Status">
      <template #body="slotProps">
        <span class="status-badge" :data-status="slotProps.data.status">
          {{ slotProps.data.status }}
        </span>
      </template>
    </Column>
    <Column field="priority" header="Priority">
      <template #body="slotProps">
        <span class="priority-badge" :data-priority="slotProps.data.priority">
          {{ slotProps.data.priority }}
        </span>
      </template>
    </Column>
    <Column field="dueDate" header="Due date">
      <template #body="slotProps">
        {{ formatDate(slotProps.data.dueDate) }}
      </template>
    </Column>
    <Column header="Actions" style="width: 180px">
      <template #body="slotProps">
        <div class="actions">
          <Button
            label="Edit"
            severity="secondary"
            text
            size="small"
            @click="emit('edit', slotProps.data)"
          />
          <Button
            label="Delete"
            severity="danger"
            text
            size="small"
            @click="emit('delete', slotProps.data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #64748b;
}

.customer-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

.customer-badge i {
  font-size: 0.75rem;
  color: #64748b;
}

.unassigned-text {
  color: #94a3b8;
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge {
  background: #f1f5f9;
  color: #334155;
}

.status-badge[data-status='New'] {
  background: #eff6ff;
  color: #1d4ed8;
}

.status-badge[data-status='In Progress'] {
  background: #fef3c7;
  color: #b45309;
}

.status-badge[data-status='Resolved'] {
  background: #f0fdf4;
  color: #15803d;
}

.status-badge[data-status='Closed'] {
  background: #f1f5f9;
  color: #64748b;
}

.priority-badge[data-priority='Urgent'] {
  background: #fee2e2;
  color: #b91c1c;
}

.priority-badge[data-priority='High'] {
  background: #ffedd5;
  color: #c2410c;
}

.priority-badge[data-priority='Medium'] {
  background: #fef9c3;
  color: #854d0e;
}

.priority-badge[data-priority='Low'] {
  background: #f1f5f9;
  color: #475569;
}
</style>
