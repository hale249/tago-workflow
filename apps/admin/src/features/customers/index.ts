// Public API of the customers feature — import from "@/features/customers" only.
export { CustomersPage } from "./pages/customers-page"
export { useCustomers, customerKeys } from "./api/customers.queries"
export type { Customer } from "./types/customer"
