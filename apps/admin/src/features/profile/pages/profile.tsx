import { useRef, useState, type FormEvent, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon, Camera01Icon, CheckmarkCircle02Icon, ComputerIcon, GlobeIcon, MoonIcon, Sun01Icon } from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { bodyStyle, headingStyle } from "@workspace/ui/lib/typography"
import { cn } from "@workspace/ui/lib/utils"
import { useTheme, type ThemePreference } from "@/components/theme/theme-provider"
import { ShortcutsDialog } from "../components/shortcuts-dialog"
import { initialsOf, useProfile } from "../profile.store"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/


/** Reference card: title + 13px description header, px-5 content (shadcn Card with shadow-surface). */
function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card py-5 text-card-foreground shadow-surface transition-[border-color,box-shadow] duration-150">
      <div className="grid auto-rows-min items-start gap-1 px-5">
        <h2 className="text-sm leading-5 font-semibold">{title}</h2>
        <p className="text-[13px] text-muted-foreground">{description}</p>
      </div>
      <div className="px-5">{children}</div>
    </section>
  )
}

function Field({ id, label, required, hint, error, children }: { id: string; label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm leading-none font-medium">
        <span className="flex items-center gap-1"><span>{label}</span>{required && <span className="text-destructive" style={bodyStyle("default")}>*</span>}</span>
      </label>
      {children}
      {error ? <p className="text-destructive" style={bodyStyle("small")}>{error}</p> : hint && <p className="text-muted-foreground" style={bodyStyle("small")}>{hint}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-base font-medium text-foreground" style={headingStyle(3)}>{title}</h3>
      <div role="none" className="h-px w-full shrink-0 bg-border/80" />
      {children}
    </div>
  )
}

function Saved({ show, text }: { show: boolean; text: string }) {
  return show ? <span className="flex items-center gap-1.5 text-sm text-emerald-600"><HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />{text}</span> : null
}

function ProfileTab() {
  const profile = useProfile()
  const [fullName, setFullName] = useState(profile.fullName)
  const [email, setEmail] = useState(profile.email)
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({})
  const [saved, setSaved] = useState(false)
  const [pw, setPw] = useState({ next: "", confirm: "" })
  const [pwErr, setPwErr] = useState<{ next?: string; confirm?: string }>({})
  const [pwSaved, setPwSaved] = useState(false)

  const saveInfo = (e: FormEvent) => {
    e.preventDefault()
    const next = { fullName: fullName.trim() ? undefined : "Vui lòng nhập họ và tên", email: EMAIL_RE.test(email.trim()) ? undefined : "Email không hợp lệ" }
    setErrors(next)
    if (next.fullName || next.email) return
    profile.update({ fullName: fullName.trim(), email: email.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }
  const savePassword = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      next: pw.next.length < 8 ? "Mật khẩu tối thiểu 8 ký tự" : undefined,
      confirm: pw.confirm !== pw.next ? "Mật khẩu xác nhận không khớp" : undefined,
    }
    setPwErr(next)
    if (next.next || next.confirm) return
    setPw({ next: "", confirm: "" })
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Thông tin cá nhân" description="Cập nhật thông tin cá nhân và liên hệ">
        <form onSubmit={saveInfo} noValidate className="max-w-2xl">
          <div className="flex flex-col gap-8">
            <Section title="Danh tính">
              <Field id="username" label="Tên đăng nhập" hint="Tên đăng nhập không thể thay đổi">
                <Input id="username" value={profile.username} disabled readOnly className="bg-muted" />
              </Field>
              <Field id="full-name" label="Họ và tên" required error={errors.fullName}>
                <Input id="full-name" value={fullName} placeholder="Nhập họ và tên" aria-invalid={!!errors.fullName} onChange={(e) => setFullName(e.target.value)} />
              </Field>
            </Section>
            <Section title="Liên hệ">
              <Field id="email" label="Email" required error={errors.email}>
                <Input id="email" type="email" value={email} placeholder="Nhập email" aria-invalid={!!errors.email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
            </Section>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" className="shadow-xs">Lưu thay đổi</Button>
              <Saved show={saved} text="Đã lưu thay đổi" />
            </div>
          </div>
        </form>
      </Card>

      <Card title="Đổi mật khẩu" description="Cập nhật mật khẩu đăng nhập của bạn">
        <form onSubmit={savePassword} noValidate className="max-w-2xl">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <Field id="new-password" label="Mật khẩu mới" required error={pwErr.next}>
                <Input id="new-password" type="password" autoComplete="new-password" placeholder="Nhập mật khẩu mới" value={pw.next} aria-invalid={!!pwErr.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </Field>
              <Field id="confirm-password" label="Xác nhận mật khẩu mới" required error={pwErr.confirm}>
                <Input id="confirm-password" type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" value={pw.confirm} aria-invalid={!!pwErr.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" className="shadow-xs" disabled={!pw.next || !pw.confirm}>Cập nhật mật khẩu</Button>
              <Saved show={pwSaved} text="Đã cập nhật mật khẩu" />
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}

function Choice({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" role="radio" aria-checked={active} onClick={onClick}
      className={cn("cursor-pointer rounded-md border-2 border-muted bg-popover p-[var(--space-200)] transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", active && "border-brand", className)}>
      {children}
    </button>
  )
}

function SettingsTab() {
  const { preference, setPreference } = useTheme()
  const { language, update } = useProfile()
  const [shortcuts, setShortcuts] = useState(false)
  const themes: [ThemePreference, string, typeof Sun01Icon][] = [["light", "Sáng", Sun01Icon], ["dark", "Tối", MoonIcon], ["system", "Hệ thống", ComputerIcon]]
  return (
    <div className="flex flex-col gap-6">
      <Card title="Giao diện" description="Tùy chỉnh giao diện ứng dụng">
        <div className="flex flex-col gap-[var(--space-150)]">
          <p className="text-sm leading-none font-medium">Giao diện</p>
          <div role="radiogroup" aria-label="Giao diện" className="grid grid-cols-3 gap-[var(--space-200)]">
            {themes.map(([id, label, Icon]) => (
              <Choice key={id} active={preference === id} onClick={() => setPreference(id)} className="flex flex-col items-center justify-between">
                <HugeiconsIcon icon={Icon} className="mb-[var(--space-150)] size-6" strokeWidth={1.5} />
                <span className="text-foreground" style={bodyStyle("small", "var(--font-weight-medium)")}>{label}</span>
              </Choice>
            ))}
          </div>
        </div>
      </Card>
      <Card title="Ngôn ngữ" description="Chọn ngôn ngữ ưa thích">
        <div role="radiogroup" aria-label="Ngôn ngữ" className="grid grid-cols-2 gap-[var(--space-200)]">
          {([["vi", "Tiếng Việt"], ["en", "English"]] as const).map(([id, label]) => (
            <Choice key={id} active={language === id} onClick={() => update({ language: id })} className="flex items-center gap-[var(--space-150)]">
              <HugeiconsIcon icon={GlobeIcon} className="size-5" strokeWidth={1.5} />
              <span className="text-foreground" style={bodyStyle("default", "var(--font-weight-medium)")}>{label}</span>
            </Choice>
          ))}
        </div>
        {language === "en" && <p className="mt-2 text-xs text-muted-foreground">Giao diện tiếng Anh chưa có — lựa chọn đã được lưu.</p>}
      </Card>
      <Card title="Phím tắt" description="Xem tất cả phím tắt có sẵn">
        <Button variant="outline" size="sm" onClick={() => setShortcuts(true)}><HugeiconsIcon icon={ArrowUpRight01Icon} className="mr-2 size-4" />Xem phím tắt</Button>
      </Card>
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
    </div>
  )
}

/** Click the avatar to pick an image (stored locally as a data URL), like the reference "Thay đổi ảnh đại diện". */
function AvatarPicker() {
  const { fullName, avatarUrl, update } = useProfile()
  const input = useRef<HTMLInputElement>(null)
  const pick = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update({ avatarUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }
  return (
    <div role="button" tabIndex={0} aria-label="Thay đổi ảnh đại diện" className="group relative cursor-pointer rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      onClick={() => input.current?.click()} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click() } }}>
      <Avatar className="size-20">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} className="object-cover" />}
        <AvatarFallback className="bg-gradient-to-br from-sky-400 to-indigo-600 text-2xl text-white">{initialsOf(fullName)}</AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        <HugeiconsIcon icon={Camera01Icon} className="size-6 text-white" strokeWidth={1.5} />
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="sr-only" aria-label="Tải lên ảnh đại diện" tabIndex={-1}
        onClick={(e) => e.stopPropagation()} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = "" }} />
    </div>
  )
}

/** User profile (reference: breadcrumb, identity card, Hồ sơ / Cài đặt tabs; ?tab=settings opens the second). */
export function ProfilePage() {
  const profile = useProfile()
  const [params, setParams] = useSearchParams()
  const tab = params.get("tab") === "settings" ? "settings" : "profile"

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-6 py-[var(--space-400)]">
        <div className="flex flex-col gap-[var(--space-400)]">
          <div className="flex flex-col gap-[var(--space-100)]">
            <nav aria-label="Breadcrumb" className="flex flex-nowrap items-center gap-2 text-sm text-muted-foreground">
              <Link to="/profile?tab=settings" className="hover:text-foreground">Cài đặt</Link>
              <span>/</span>
              <span aria-current="page" className="font-medium text-foreground">Hồ sơ</span>
            </nav>
            <h1 className="text-foreground" style={headingStyle(1)}>Hồ sơ người dùng</h1>
          </div>

          <section className="rounded-lg border border-border bg-card p-[var(--space-300)]">
            <div className="flex flex-nowrap items-center gap-[var(--space-250)]">
              <AvatarPicker />
              <div className="flex min-w-0 flex-col gap-[var(--space-050)]">
                <h2 className="truncate text-foreground" style={headingStyle(2)}>{profile.fullName}</h2>
                <p className="truncate text-muted-foreground" style={bodyStyle("default")}>{profile.email}</p>
                <p className="text-muted-foreground" style={bodyStyle("small")}>@{profile.username}</p>
              </div>
            </div>
          </section>

          <div role="none" className="h-px w-full shrink-0 bg-border/80" />

          <div>
            <div role="tablist" aria-orientation="horizontal" className="grid h-10 w-full grid-cols-2 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              {([["profile", "Hồ sơ"], ["settings", "Cài đặt"]] as const).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} data-state={tab === id ? "active" : "inactive"}
                  onClick={() => setParams(id === "settings" ? { tab: "settings" } : {}, { replace: true })}
                  className="inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=active]:bg-primary-subtle data-[state=active]:text-primary-subtle-foreground">
                  {label}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="mt-6">{tab === "profile" ? <ProfileTab /> : <SettingsTab />}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
