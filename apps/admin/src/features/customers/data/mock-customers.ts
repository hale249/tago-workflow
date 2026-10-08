import type { Customer, CustomerTag, Person } from "../types/customer"

const COMPANIES = [
  "Global Dynamics Corp", "Innovatech Industries", "Pioneer Technologies", "Apex Consulting",
  "Evergreen Logistics", "Crestview Communications", "Legacy Health Solutions", "Frontier Energy Corp",
  "Noble Industries", "Summit Software Systems", "Vertex Financial Services", "Quantum Computing",
  "Horizon Ventures", "Nexus Tech", "Stellar Aerospace", "Orion Enterprises", "Zenith Corp",
  "Aurora Systems", "Catalyst Innovations", "Titan Dynamics", "Paragon Solutions", "Omega Group",
]
const LOCATIONS = ["San Francisco, US", "London, UK", "Berlin, DE", "Tokyo, JP", "Austin, US", "Toronto, CA", "Sydney, AU"]
const TAGS: CustomerTag[] = ["SaaS", "Fintech", "Healthcare", "Enterprise", "AI", "Logistics", "Energy"]
const NAMES = ["James Lee", "Karen Lee", "Sophia Turner", "Liam Carter", "Emma Brooks", "Noah Patel", "Olivia Chen", "Mason Reed", "Ava Morgan", "Ethan Wright"]
const COLORS = ["from-sky-400 to-blue-600", "from-emerald-400 to-teal-600", "from-orange-400 to-rose-600", "from-violet-400 to-purple-600", "from-amber-300 to-orange-500", "from-pink-400 to-fuchsia-600"]
const EMPLOYEES = ["1-10", "11-50", "51-200", "200-500", "500-1000", "1000+"]

// Deterministic PRNG so mock data is stable across reloads.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

const rand = rng(42)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!
const person = (): Person => {
  const name = pick(NAMES)
  return { name, initials: name.split(" ").map((p) => p[0]).join(""), color: pick(COLORS) }
}
const slug = (s: string) => s.toLowerCase().split(" ")[0]!.replace(/[^a-z]/g, "")

export const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 120 }, (_, i) => {
  const account = COMPANIES[i % COMPANIES.length]! + (i >= COMPANIES.length ? ` ${Math.floor(i / COMPANIES.length) + 1}` : "")
  const domain = `${slug(account)}.com`
  const start = new Date(2023, Math.floor(rand() * 24), 1 + Math.floor(rand() * 27))
  const last = new Date(2026, 9, 8 - Math.floor(rand() * 60))
  return {
    id: `cus_${String(i + 1).padStart(4, "0")}`,
    account,
    legalName: `${account}, Inc`,
    logoColor: pick(COLORS),
    location: pick(LOCATIONS),
    website: domain,
    categories: Array.from(new Set([pick(TAGS), pick(TAGS)])),
    lead: person(),
    team: Array.from({ length: 2 + Math.floor(rand() * 3) }, person),
    amount: Math.round(5_000 + rand() * 245_000),
    startDate: start.toISOString(),
    communication: { messages: Math.floor(rand() * 400), emails: Math.floor(rand() * 1500) },
    onlinePresence: { linkedin: account, twitter: `@${slug(account)}` },
    founded: 1990 + Math.floor(rand() * 34),
    founders: [person(), person()],
    employees: pick(EMPLOYEES),
    email: `${slug(pick(NAMES))}@${domain}`,
    lastInteraction: last.toISOString(),
    responseRate: Math.round(40 + rand() * 60),
  }
})
