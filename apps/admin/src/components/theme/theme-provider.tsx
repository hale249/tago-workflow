import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"
/** What the user picked; "system" follows the OS setting. */
export type ThemePreference = Theme | "system"
type ThemeContextValue = { theme: Theme; preference: ThemePreference; setPreference: (p: ThemePreference) => void; toggleTheme: () => void }

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = "tago-theme"
const media = () => window.matchMedia("(prefers-color-scheme: dark)")

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "light" || saved === "dark" || saved === "system") return saved
  } catch {
    /* ignore */
  }
  return "system"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readPreference)
  const [systemDark, setSystemDark] = useState(() => media().matches)
  const theme: Theme = preference === "system" ? (systemDark ? "dark" : "light") : preference

  useEffect(() => {
    const m = media()
    const on = () => setSystemDark(m.matches)
    m.addEventListener("change", on)
    return () => m.removeEventListener("change", on)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    try {
      localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      /* ignore */
    }
  }, [theme, preference])

  return (
    <ThemeContext value={{ theme, preference, setPreference, toggleTheme: () => setPreference(theme === "dark" ? "light" : "dark") }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
