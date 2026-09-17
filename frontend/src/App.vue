<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useTickets } from './composables/useTickets'
import type { TicketFormValues, TicketRecord } from './types/ticket'

const { tickets, loading, error, statusOptions, priorityOptions, ticketSummary, load, create, update, remove } = useTickets()
const confirm = useConfirm()

const isDialogOpen = ref(false)
const editingTicket = ref<TicketRecord | null>(null)
const formValues = ref<TicketFormValues>({
  subject: '',
  description: '',
  status: 'New',
  priority: 'Medium',
  dueDate: null
})

const title = computed(() => (editingTicket.value ? 'Edit ticket' : 'Create ticket'))

function parseDateInput(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function resetForm() {
  formValues.value = {
    subject: '',
    description: '',
    status: 'New',
    priority: 'Medium',
    dueDate: null
  }
  editingTicket.value = null
}

function openCreateDialog() {
  resetForm()
  isDialogOpen.value = true
}

function openEditDialog(ticket: TicketRecord) {
  editingTicket.value = ticket
  formValues.value = {
    subject: ticket.subject || '',
    description: ticket.description || '',
    status: ticket.status || 'New',
    priority: ticket.priority || 'Medium',
    dueDate: parseDateInput(ticket.dueDate ?? null)
  }
  isDialogOpen.value = true
}

async function submit() {
  if (!formValues.value.subject.trim()) {
    return
  }

  if (!editingTicket.value) {
    await create(formValues.value)
  } else {
    await update(editingTicket.value.id || '', formValues.value)
  }

  isDialogOpen.value = false
  resetForm()
  await load()
}

function confirmDelete(ticket: TicketRecord) {
  confirm.require({
    message: `Delete ticket "${ticket.subject}"?`,
    header: 'Delete ticket',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    accept: async () => {
      await remove(ticket.id || '')
      await load()
    }
  })
}

onMounted(() => {
  load()
})
</script>

<template>
  <div class="app-shell">
    <ConfirmDialog />
    <header class="header">
      <div>
        <h1>Support Tickets</h1>
        <p>{{ ticketSummary.total }} total · {{ ticketSummary.open }} open</p>
      </div>
      <Button label="New ticket" icon="pi pi-plus" @click="openCreateDialog" />
    </header>

    <section class="table-card">
      <div v-if="error" class="error-banner">{{ error }}</div>

      <DataTable :value="tickets" striped-rows responsive-layout="scroll" :loading="loading">
        <Column field="subject" header="Subject" />
        <Column field="status" header="Status" />
        <Column field="priority" header="Priority" />
        <Column field="dueDate" header="Due date">
          <template #body="slotProps">
            {{ slotProps.data.dueDate ? new Date(slotProps.data.dueDate).toLocaleDateString() : '—' }}
          </template>
        </Column>
        <Column header="Actions" style="width: 200px">
          <template #body="slotProps">
            <div class="actions">
              <Button label="Edit" severity="secondary" text @click="openEditDialog(slotProps.data)" />
              <Button label="Delete" severity="danger" text @click="confirmDelete(slotProps.data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog v-model:visible="isDialogOpen" :header="title" modal>
      <div class="form-grid">
        <label>
          <span>Subject</span>
          <InputText v-model="formValues.subject" />
        </label>

        <label>
          <span>Description</span>
          <Textarea v-model="formValues.description" rows="4" auto-resize />
        </label>

        <div class="two-col">
          <label>
            <span>Status</span>
            <Select v-model="formValues.status" :options="statusOptions" />
          </label>

          <label>
            <span>Priority</span>
            <Select v-model="formValues.priority" :options="priorityOptions" />
          </label>
        </div>

        <label>
          <span>Due date</span>
          <Calendar v-model="formValues.dueDate" date-format="dd/mm/yy" />
        </label>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <Button label="Cancel" severity="secondary" text @click="isDialogOpen = false" />
          <Button label="Save" @click="submit" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: Inter, 'Segoe UI', sans-serif;
  background: #f4f6fb;
}

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 18px;
}

.header h1 {
  margin: 0;
}

.header p {
  margin: 6px 0 0;
  color: #58677a;
}

.table-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.error-banner {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fff1f2;
  color: #9f1239;
  border: 1px solid #fecdd3;
}

.actions {
  display: flex;
  gap: 8px;
}

.form-grid {
  display: grid;
  gap: 16px;
  min-width: 420px;
}

.form-grid label {
  display: grid;
  gap: 8px;
}

.form-grid span {
  font-weight: 600;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
