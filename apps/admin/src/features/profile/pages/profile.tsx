import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router"
import { CheckCircle2, Globe, Keyboard, Monitor, Moon, Sun } from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useTheme, type ThemePreference } from "@/components/theme/theme-provider"
import { ShortcutsDialog } from "../components/shortcuts-dialog"
import { initialsOf, useProfile } from "../profile.store"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Field({ id, label, required, hint, error, children }: { id: string; label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label}{required && <span className="ml-1 text-destructive">*</span>}</label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Saved({ show, text }: { show: boolean; text: string }) {
  return show ? <span className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle2 className="size-4" />{text}</span> : null
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
  const dirty = fullName !== profile.fullName || email !== profile.email

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
    <div className="space-y-6">
      <Card title="Thông tin cá nhân" description="Cập nhật thông tin cá nhân và liên hệ">
        <form onSubmit={saveInfo} noValidate className="space-y-6">
          <div className="space-y-4">
            <h3 className="border-b pb-4 font-semibold">Danh tính</h3>
            <Field id="username" label="Tên đăng nhập" hint="Tên đăng nhập không thể thay đổi">
              <Input id="username" value={profile.username} disabled readOnly className="bg-muted" />
            </Field>
            <Field id="full-name" label="Họ và tên" required error={errors.fullName}>
              <Input id="full-name" value={fullName} aria-invalid={!!errors.fullName || undefined} onChange={(e) => setFullName(e.target.value)} />
            </Field>
          </div>
          <div className="space-y-4">
            <h3 className="border-b pb-4 font-semibold">Liên hệ</h3>
            <Field id="email" label="Email" required error={errors.email}>
              <Input id="email" type="email" value={email} aria-invalid={!!errors.email || undefined} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Saved show={saved} text="Đã lưu thay đổi" />
            <Button type="submit" size="sm" disabled={!dirty}>Lưu thay đổi</Button>
          </div>
        </form>
      </Card>

      <Card title="Đổi mật khẩu" description="Cập nhật mật khẩu đăng nhập của bạn">
        <form onSubmit={savePassword} noValidate className="space-y-4">
          <Field id="new-password" label="Mật khẩu mới" required error={pwErr.next} hint="Tối thiểu 8 ký tự">
            <Input id="new-password" type="password" autoComplete="new-password" value={pw.next} aria-invalid={!!pwErr.next || undefined} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <Field id="confirm-password" label="Xác nhận mật khẩu mới" required error={pwErr.confirm}>
            <Input id="confirm-password" type="password" autoComplete="new-password" value={pw.confirm} aria-invalid={!!pwErr.confirm || undefined} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <div className="flex items-center justify-end gap-3">
            <Saved show={pwSaved} text="Đã cập nhật mật khẩu" />
            <Button type="submit" size="sm" disabled={!pw.next || !pw.confirm}>Cập nhật mật khẩu</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

function Choice({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" role="radio" aria-checked={active} onClick={onClick}
      className={cn("rounded-md border bg-background transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", active && "border-2 border-brand", className)}>
      {children}
    </button>
  )
}

function SettingsTab() {
  const { preference, setPreference } = useTheme()
  const { language, update } = useProfile()
  const [shortcuts, setShortcuts] = useState(false)
  const themes: [ThemePreference, string, typeof Sun][] = [["light", "Sáng", Sun], ["dark", "Tối", Moon], ["system", "Hệ thống", Monitor]]
  return (
    <div className="space-y-6">
      <Card title="Giao diện" description="Tùy chỉnh giao diện ứng dụng">
        <p className="mb-2 text-sm font-medium">Giao diện</p>
        <div role="radiogroup" aria-label="Giao diện" className="grid grid-cols-3 gap-4">
          {themes.map(([id, label, Icon]) => (
            <Choice key={id} active={preference === id} onClick={() => setPreference(id)} className="flex h-[88px] flex-col items-center justify-center gap-2">
              <Icon className="size-5" strokeWidth={1.5} />
              <span className="text-xs font-medium">{label}</span>
            </Choice>
          ))}
        </div>
      </Card>
      <Card title="Ngôn ngữ" description="Chọn ngôn ngữ ưa thích">
        <div role="radiogroup" aria-label="Ngôn ngữ" className="grid grid-cols-2 gap-4">
          {([["vi", "Tiếng Việt"], ["en", "English"]] as const).map(([id, label]) => (
            <Choice key={id} active={language === id} onClick={() => update({ language: id })} className="flex h-14 items-center gap-3 px-4 text-sm font-medium">
              <Globe className="size-5" strokeWidth={1.5} />{label}
            </Choice>
          ))}
        </div>
        {language === "en" && <p className="mt-2 text-xs text-muted-foreground">Giao diện tiếng Anh chưa có — lựa chọn đã được lưu.</p>}
      </Card>
      <Card title="Phím tắt" description="Xem tất cả phím tắt có sẵn">
        <Button variant="outline" size="sm" onClick={() => setShortcuts(true)}><Keyboard />Xem phím tắt</Button>
      </Card>
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
    </div>
  )
}

/** User profile (reference: breadcrumb, identity card, Hồ sơ / Cài đặt tabs; ?tab=settings opens the second). */
export function ProfilePage() {
  const profile = useProfile()
  const [params, setParams] = useSearchParams()
  const tab = params.get("tab") === "settings" ? "settings" : "profile"
  useEffect(() => { document.title = "Hồ sơ người dùng" }, [])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link to="/profile?tab=settings" className="text-muted-foreground hover:text-foreground">Cài đặt</Link>
          <span className="text-muted-foreground">/</span>
          <span aria-current="page" className="font-medium">Hồ sơ</span>
        </nav>
        <h1 className="mt-3 text-2xl font-semibold">Hồ sơ người dùng</h1>

        <section className="mt-8 flex items-center gap-6 rounded-lg border bg-card p-6 sm:px-9">
          <Avatar className="size-14">
            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-indigo-600 text-lg text-white">{initialsOf(profile.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold">{profile.fullName}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">{profile.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">@{profile.username}</p>
          </div>
        </section>

        <div className="my-8 border-t" />

        <div role="tablist" className="mb-6 grid grid-cols-2 rounded-md bg-muted p-0.5">
          {([["profile", "Hồ sơ"], ["settings", "Cài đặt"]] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id}
              onClick={() => setParams(id === "settings" ? { tab: "settings" } : {}, { replace: true })}
              className={cn("h-9 rounded-[5px] text-sm transition-colors", tab === id ? "bg-brand/8 font-medium text-brand" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>
        {tab === "profile" ? <ProfileTab /> : <SettingsTab />}
      </div>
    </div>
  )
}
