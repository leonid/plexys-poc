<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Calendar from 'primevue/calendar'
import type { TicketFormValues, TicketRecord } from '../types/ticket'

const props = defineProps<{
  visible: boolean
  ticket: TicketRecord | null
  statusOptions: string[]
  priorityOptions: string[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', values: TicketFormValues): void
}>()

const formValues = ref<TicketFormValues>({
  subject: '',
  description: '',
  status: 'New',
  priority: 'Medium',
  dueDate: null
})

const subjectError = ref('')

const title = computed(() => (props.ticket ? 'Edit Ticket' : 'Create Ticket'))

function parseDateInput(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function syncForm() {
  subjectError.value = ''
  if (props.ticket) {
    formValues.value = {
      subject: props.ticket.subject || '',
      description: props.ticket.description || '',
      status: props.ticket.status || 'New',
      priority: props.ticket.priority || 'Medium',
      dueDate: parseDateInput(props.ticket.dueDate ?? null)
    }
  } else {
    formValues.value = {
      subject: '',
      description: '',
      status: 'New',
      priority: 'Medium',
      dueDate: null
    }
  }
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      syncForm()
    }
  }
)

function handleClose() {
  emit('update:visible', false)
}

function handleSubmit() {
  if (!formValues.value.subject.trim()) {
    subjectError.value = 'Subject is required.'
    return
  }
  subjectError.value = ''
  emit('save', { ...formValues.value })
}
</script>

<template>
  <Dialog
    :visible="visible"
    :header="title"
    modal
    :style="{ width: '520px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <form class="form-grid" @submit.prevent="handleSubmit">
      <div class="field">
        <label for="subject">
          <span>Subject <span class="required">*</span></span>
        </label>
        <InputText
          id="subject"
          v-model="formValues.subject"
          :invalid="Boolean(subjectError)"
          placeholder="Brief summary of the issue"
        />
        <small v-if="subjectError" class="field-error">{{ subjectError }}</small>
      </div>

      <div class="field">
        <label for="description">
          <span>Description</span>
        </label>
        <Textarea
          id="description"
          v-model="formValues.description"
          rows="4"
          auto-resize
          placeholder="Additional context or details"
        />
      </div>

      <div class="two-col">
        <div class="field">
          <label for="status">
            <span>Status <span class="required">*</span></span>
          </label>
          <Select id="status" v-model="formValues.status" :options="statusOptions" />
        </div>

        <div class="field">
          <label for="priority">
            <span>Priority <span class="required">*</span></span>
          </label>
          <Select id="priority" v-model="formValues.priority" :options="priorityOptions" />
        </div>
      </div>

      <div class="field">
        <label for="dueDate">
          <span>Due date</span>
        </label>
        <Calendar id="dueDate" v-model="formValues.dueDate" date-format="dd/mm/yy" show-icon />
      </div>
    </form>

    <template #footer>
      <div class="dialog-actions">
        <Button label="Cancel" severity="secondary" text @click="handleClose" />
        <Button label="Save" icon="pi pi-check" @click="handleSubmit" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: 16px;
  padding-top: 8px;
}

.field {
  display: grid;
  gap: 6px;
}

.field label span {
  font-weight: 600;
  font-size: 0.9rem;
  color: #334155;
}

.required {
  color: #ef4444;
}

.field-error {
  color: #ef4444;
  font-size: 0.8rem;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
