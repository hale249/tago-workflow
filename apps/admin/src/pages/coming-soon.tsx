import { Construction } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-background text-muted-foreground">
        <Construction className="size-8" />
        <p className="text-sm">Module “{title}” đang được phát triển.</p>
      </div>
    </>
  )
}
