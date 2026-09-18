<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import TicketTable from './components/TicketTable.vue'
import TicketModal from './components/TicketModal.vue'
import { useTickets } from './composables/useTickets'
import { clearAuthToken, getAuthToken, getJwtUserId, setAuthToken } from './services/corteza'
import type { TicketFormValues, TicketRecord } from './types/ticket'

const {
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
} = useTickets()

const confirm = useConfirm()

const isModalVisible = ref(false)
const editingTicket = ref<TicketRecord | null>(null)

// Auth modal state
const isAuthDialogOpen = ref(false)
const authTokenInput = ref('')
const currentToken = ref(getAuthToken())
const currentUserId = computed(() => getJwtUserId())
const isAuthed = computed(() => Boolean(currentToken.value))

function refreshAuth() {
  currentToken.value = getAuthToken()
}

function openAuthDialog() {
  authTokenInput.value = currentToken.value
  isAuthDialogOpen.value = true
}

function saveToken() {
  setAuthToken(authTokenInput.value.trim(), true)
  refreshAuth()
  isAuthDialogOpen.value = false
  load()
}

function handleLogout() {
  clearAuthToken()
  authTokenInput.value = ''
  refreshAuth()
  isAuthDialogOpen.value = false
  load()
}

function openCreateDialog() {
  editingTicket.value = null
  isModalVisible.value = true
}

function openEditDialog(ticket: TicketRecord) {
  editingTicket.value = ticket
  isModalVisible.value = true
}

async function handleSave(values: TicketFormValues) {
  if (!editingTicket.value) {
    await create(values)
  } else {
    await update(editingTicket.value.id || '', values)
  }
  isModalVisible.value = false
  editingTicket.value = null
  await load()
}

function handleDelete(ticket: TicketRecord) {
  confirm.require({
    message: `Are you sure you want to delete ticket "${ticket.subject}"?`,
    header: 'Delete Ticket',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await remove(ticket.id || '')
      await load()
    }
  })
}

onMounted(() => {
  refreshAuth()
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
      <div class="header-actions">
        <Button
          :label="isAuthed ? `User (${currentUserId || 'Active'})` : 'Set Auth Token'"
          :icon="isAuthed ? 'pi pi-user-check' : 'pi pi-key'"
          :severity="isAuthed ? 'success' : 'warn'"
          outlined
          size="small"
          @click="openAuthDialog"
        />
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          aria-label="Refresh tickets"
          :loading="loading"
          @click="load"
        />
        <Button label="New Ticket" icon="pi pi-plus" @click="openCreateDialog" />
      </div>
    </header>

    <section class="table-card">
      <div v-if="error" class="error-banner">
        <i class="pi pi-exclamation-circle"></i>
        <div class="error-content">
          <span>{{ error }}</span>
          <Button
            v-if="!isAuthed"
            label="Provide Auth Token"
            size="small"
            severity="danger"
            text
            @click="openAuthDialog"
          />
        </div>
      </div>

      <TicketTable
        :tickets="tickets"
        :loading="loading"
        @edit="openEditDialog"
        @delete="handleDelete"
      />
    </section>

    <TicketModal
      v-model:visible="isModalVisible"
      :ticket="editingTicket"
      :status-options="statusOptions"
      :priority-options="priorityOptions"
      @save="handleSave"
    />

    <!-- Auth / Session Modal -->
    <Dialog v-model:visible="isAuthDialogOpen" header="Corteza Authentication" modal :style="{ width: '500px' }">
      <div class="auth-dialog-content">
        <p class="auth-info">
          Corteza REST API requires an OAuth Bearer JWT. You can set the token dynamically for this session,
          pass it via URL (<code>?token=...</code>), or keep it in <code>.env</code>.
        </p>

        <label class="token-field">
          <span>Bearer JWT Token</span>
          <InputText
            v-model="authTokenInput"
            placeholder="Paste eyJhbGciOi... JWT token"
            class="token-input"
          />
        </label>
      </div>

      <template #footer>
        <div class="dialog-actions">
          <Button v-if="isAuthed" label="Clear Token" severity="danger" text @click="handleLogout" />
          <Button label="Cancel" severity="secondary" text @click="isAuthDialogOpen = false" />
          <Button label="Save & Connect" icon="pi pi-check" @click="saveToken" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f4f6fb;
  color: #1e293b;
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
  padding-bottom: 24px;
}

.header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
  border: 1px solid #e2e8f0;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 10px;
  background: #fff1f2;
  color: #9f1239;
  border: 1px solid #fecdd3;
  font-size: 0.95rem;
}

.error-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 12px;
}

.auth-dialog-content {
  display: grid;
  gap: 16px;
  padding-top: 8px;
}

.auth-info {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.4;
}

.auth-info code {
  background: #f1f5f9;
  padding: 2px 4px;
  border-radius: 4px;
  color: #0f172a;
}

.token-field {
  display: grid;
  gap: 6px;
}

.token-field span {
  font-weight: 600;
  font-size: 0.875rem;
  color: #334155;
}

.token-input {
  width: 100%;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
