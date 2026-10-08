import { useEffect } from "react"
import { Plus, Share, Users } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { PageHeader } from "@/components/layout/page-header"
import { useCustomers } from "../api/customers.queries"
import { CustomerDrawer } from "../components/customer-drawer"
import { CustomersTable } from "../components/customers-table"
import { CustomersToolbar } from "../components/customers-toolbar"
import { useCustomersView } from "../hooks/use-customers-view"
import { useCustomersTableStore } from "../store/customers-table.store"

export function CustomersPage() {
  const { data, isLoading } = useCustomers()
  const { rows, columns } = useCustomersView(data)
  const { activeCustomerId, openCustomer } = useCustomersTableStore()
  const activeCustomer = data?.find((c) => c.id === activeCustomerId)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openCustomer(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openCustomer])

  return (
    <>
      <PageHeader
        title="Customers"
        icon={<Users className="size-4 text-muted-foreground" />}
        actions={
          <>
            <Button size="sm" variant="ghost" className="h-8 max-sm:size-8 max-sm:px-0" aria-label="Share"><Share /><span className="max-sm:sr-only">Share</span></Button>
            <Button size="sm" className="h-8 max-sm:size-8 max-sm:px-0" aria-label="New customer"><Plus /><span className="max-sm:sr-only">Customer</span></Button>
          </>
        }
      />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-background">
        <CustomersToolbar total={rows.length} />
        <CustomersTable rows={rows} columns={columns} isLoading={isLoading} />
      </section>
      <CustomerDrawer customer={activeCustomer} />
    </>
  )
}
