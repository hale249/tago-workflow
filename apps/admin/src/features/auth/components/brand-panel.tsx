import { BRANDING } from "@/config/branding"

/** Left half of the login screen; tinted from --brand so re-branding carries over. */
export function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden rounded-xl bg-linear-to-b from-[color-mix(in_oklab,var(--brand)_45%,black)] to-brand p-10 text-white lg:flex lg:flex-col lg:justify-end">
      {/* Dark-mode --brand is a pale tint; deepen it so white text keeps contrast. */}
      <div className="pointer-events-none absolute inset-0 dark:bg-black/25" />
      <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-black/15 blur-3xl" />
      <div className="relative max-w-md">
        <p className="text-3xl leading-tight font-semibold">Manage customers, workflows and billing in one place.</p>
        <p className="mt-3 text-sm text-white/75">Sign in to {BRANDING.name} to pick up where your team left off.</p>
      </div>
    </aside>
  )
}
