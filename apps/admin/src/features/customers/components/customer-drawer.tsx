import { useCallback, useState, type ReactNode } from "react"
import {
  AtSign, Building2, Calendar, ChevronRight, FileText, Globe, Link2, Mail, MapPin, MessageSquare,
  MoreHorizontal, RefreshCw, StickyNote, UserCircle, Users, X,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import { useResizeHandle } from "@/hooks/use-resize-handle"
import { formatCurrency } from "@/lib/format"
import { useCustomersTableStore } from "../store/customers-table.store"
import type { Customer } from "../types/customer"
import { CompanyLogo, PersonAvatar, TagBadge } from "./cells"

const MIN_WIDTH = 360

function Field({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-2 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4" />{label}</span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

function StatCard({ label, value, tag, hint }: { label: string; value: string; tag: string; hint: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="rounded bg-emerald-100 px-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{tag}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function DetailsTab({ c }: { c: Customer }) {
  const rateLabel = c.responseRate >= 80 ? "Very Good" : c.responseRate >= 60 ? "Good" : "Low"
  return (
    <div className="space-y-6">
      <div className="divide-y">
        <Field icon={Building2} label="Legal Name">{c.legalName}</Field>
        <Field icon={AtSign} label="Email">{c.email}</Field>
        <Field icon={Globe} label="Website"><span className="text-brand">{c.website}</span></Field>
        <Field icon={MapPin} label="Location">{c.location}</Field>
        <Field icon={Calendar} label="Founded">{c.founded}</Field>
        <Field icon={UserCircle} label="Founders">
          <span className="flex items-center gap-2">
            {c.founders.map((f, i) => <span key={i} className="flex items-center gap-1.5"><PersonAvatar person={f} className="size-5" />{f.name}</span>)}
          </span>
        </Field>
        <Field icon={Link2} label="LinkedIn">{c.onlinePresence.linkedin}</Field>
        <Field icon={Users} label="Employees">{c.employees}</Field>
        <Field icon={FileText} label="Contract">{formatCurrency(c.amount)}</Field>
        <Field icon={StickyNote} label="Categories">
          <span className="flex gap-1">{c.categories.map((t) => <TagBadge key={t} tag={t} />)}</span>
        </Field>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Overview</h3>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs">Change Card</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs"><RefreshCw /> Refresh</Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Response Rate" value={`${c.responseRate}%`} tag={rateLabel}
            hint="Response rate indicates the percentage of recipients who respond to emails or surveys." />
          <StatCard label="Email Exchange Rate" value={c.communication.emails.toLocaleString()} tag={c.communication.emails > 700 ? "High" : "Normal"}
            hint="Email exchange rate shows the total number of emails sent and received." />
        </div>
      </div>
    </div>
  )
}

const TABS = ["Details", "Messages", "Files", "Activities", "Tasks", "Settings"] as const

export function CustomerDrawer({ customer }: { customer: Customer | undefined }) {
  const openCustomer = useCustomersTableStore((s) => s.openCustomer)
  const [width, setWidth] = useState(560)
  const { isResizing, onPointerDown } = useResizeHandle(
    useCallback((x: number) => setWidth(Math.max(MIN_WIDTH, Math.min(window.innerWidth - 240, window.innerWidth - x))), []),
  )
  const open = Boolean(customer)

  return (
    <aside
      style={{ width }}
      className={cn(
        "fixed inset-y-0 right-0 z-40 flex max-w-full flex-col border-l bg-background shadow-2xl",
        !isResizing && "transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
    >
      <div onPointerDown={onPointerDown} className="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize hover:bg-brand/30" />

      {customer && (
        <>
          <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
            <div className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Customers</span>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <span className="truncate font-medium">{customer.account}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8"><FileText /> Contract</Button>
              <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal /></Button>
              <Button variant="ghost" size="icon" className="size-8" onClick={() => openCustomer(null)}><X /></Button>
            </div>
          </header>

          <div className="no-scrollbar flex-1 overflow-y-auto">
            <div className="space-y-4 p-6">
              <CompanyLogo name={customer.account} color={customer.logoColor} className="size-12 rounded-xl text-lg" />
              <div>
                <h2 className="text-xl font-semibold">{customer.account}</h2>
                <p className="text-sm text-muted-foreground">{customer.website}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline"><MessageSquare /> Message</Button>
                <Button size="sm" variant="outline"><Mail /> Email</Button>
                <Button size="sm" variant="outline"><StickyNote /> Add Note</Button>
              </div>
            </div>

            <Tabs defaultValue="Details" className="px-6 pb-8">
              <TabsList className="mb-4">
                {TABS.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
              </TabsList>
              <TabsContent value="Details"><DetailsTab c={customer} /></TabsContent>
              {TABS.slice(1).map((t) => (
                <TabsContent key={t} value={t}>
                  <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">{t} — coming soon</div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </>
      )}
    </aside>
  )
}
