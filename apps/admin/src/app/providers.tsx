import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { queryClient } from "@/lib/query-client"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
