export type Person = { name: string; initials: string; color: string }

export type CustomerTag = "SaaS" | "Fintech" | "Healthcare" | "Enterprise" | "AI" | "Logistics" | "Energy"

export type Customer = {
  id: string
  account: string
  legalName: string
  logoColor: string
  location: string
  website: string
  categories: CustomerTag[]
  lead: Person
  team: Person[]
  amount: number
  startDate: string
  communication: { messages: number; emails: number }
  onlinePresence: { linkedin: string; twitter: string }
  founded: number
  founders: Person[]
  employees: string
  email: string
  lastInteraction: string
  responseRate: number
}

export type SortDirection = "asc" | "desc"
export type SortState = { columnId: string; direction: SortDirection } | null
