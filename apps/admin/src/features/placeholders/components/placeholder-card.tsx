import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

/** Centered dashed "coming soon" card — mirrors beqeek's placeholder pages (roles, help, …). */
export function PlaceholderCard({ icon, title, description }: { icon: IconSvgElement; title: string; description: string }) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-background p-6 lg:p-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-lg border border-dashed bg-card py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150">
        <div className="flex flex-col items-center gap-4 px-5 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <HugeiconsIcon icon={icon} strokeWidth={1.5} className="size-6 text-primary" />
          </div>
          <h2 className="text-xl leading-7 font-semibold tracking-[-0.005em] text-foreground">{title}</h2>
        </div>
        {/* pb-6 = the reference's empty action row under space-y-6 */}
        <div className="px-5 pb-6 text-center">
          <p className="text-sm leading-[22px] text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  )
}
