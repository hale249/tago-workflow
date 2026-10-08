import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Profile = { username: string; fullName: string; email: string; language: "vi" | "en" }

type State = Profile & { update: (p: Partial<Profile>) => void }

/** Local stand-in for the signed-in user's profile (no auth backend yet). */
export const useProfile = create<State>()(
  persist(
    (set) => ({
      username: "louis",
      fullName: "Louis Cooper",
      email: "louis@evergreen.com",
      language: "vi",
      update: (p) => set(p),
    }),
    { name: "tago-profile", partialize: ({ update: _, ...rest }) => rest },
  ),
)

export const initialsOf = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase() || "?"
