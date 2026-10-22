// Shared class strings for the reference look — compose with cn().

/** Dialog shell: 16px padding on phones, 24px from sm, scrolls inside the viewport. Add the sm:max-w-[…] width. */
export const DIALOG_CONTENT = "max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto p-4 sm:p-6"

/** Toolbar / page action buttons (reference h-7 with a 16px icon). */
export const SMALL_BTN = "h-7 gap-1.5 px-2.5 has-[>svg]:px-2"

// Reference data-table: 36px rows, 13px muted header, hairline row borders.
export const TABLE_CARD = "flex flex-col gap-4 rounded-lg border bg-card py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150"
export const TH = "h-9 px-3 text-left align-middle text-[13px] font-medium whitespace-nowrap text-muted-foreground"
export const TD = "h-9 px-3 py-1.5 align-middle"
export const TR = "border-b border-border/70 transition-colors hover:bg-muted/60 data-[state=selected]:bg-primary/[0.06]"

/** Plain <input>/<textarea> styled like the reference form controls (for raw elements; prefer Input / Textarea). */
const FIELD = "flex w-full rounded-md border border-input bg-background text-sm transition-all placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"
export const INPUT_FIELD = `${FIELD} h-8 px-3 py-1.5`
export const TEXTAREA_FIELD = `${FIELD} min-h-[80px] px-3 py-2`
