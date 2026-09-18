import { ref, computed } from 'vue'
import { cortezaService } from '../services/corteza'
import type { CustomerRecord } from '../types/customer'

export function useCustomers() {
  const customers = ref<CustomerRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const customerOptions = computed(() => [
    { label: 'Unassigned (No Customer)', value: '' },
    ...customers.value.map((c) => ({
      label: c.company ? `${c.name} (${c.company})` : c.name,
      value: c.id
    }))
  ])

  async function loadCustomers() {
    loading.value = true
    error.value = null
    try {
      customers.value = await cortezaService.listCustomers()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load customers'
    } finally {
      loading.value = false
    }
  }

  function getCustomerById(id: string | null | undefined): CustomerRecord | undefined {
    if (!id) return undefined
    return customers.value.find((c) => c.id === id)
  }

  function getCustomerLabel(id: string | null | undefined): string {
    const customer = getCustomerById(id)
    if (!customer) return '—'
    return customer.company ? `${customer.name} (${customer.company})` : customer.name
  }

  return {
    customers,
    loading,
    error,
    customerOptions,
    loadCustomers,
    getCustomerById,
    getCustomerLabel
  }
}
