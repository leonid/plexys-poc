<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import type { TicketRecord } from '../types/ticket'

defineProps<{
  tickets: TicketRecord[]
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
</script>

<template>
  <DataTable :value="tickets" striped-rows responsive-layout="scroll" :loading="loading">
    <template #empty>
      <div class="empty-state">No support tickets found.</div>
    </template>

    <Column field="subject" header="Subject" />
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
