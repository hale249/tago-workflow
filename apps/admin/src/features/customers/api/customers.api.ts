import { MOCK_CUSTOMERS } from "../data/mock-customers"
import type { Customer } from "../types/customer"

// Swap these for real HTTP calls (fetch/axios) when the backend is ready.
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const customersApi = {
  async list(): Promise<Customer[]> {
    await delay(300)
    return MOCK_CUSTOMERS
  },
  async getById(id: string): Promise<Customer | undefined> {
    await delay(150)
    return MOCK_CUSTOMERS.find((c) => c.id === id)
  },
}
