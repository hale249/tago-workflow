import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { cn } from "@workspace/ui/lib/utils"

type Errors = { username?: string; password?: string }

const field =
  "h-8 w-full rounded-md border border-slate-600 bg-slate-700/50 px-3 text-sm text-slate-200 outline-none placeholder:text-slate-400 transition-colors focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/40 aria-invalid:border-red-400"

/** UI-only: validates locally, fakes a request, then enters the app. No real auth yet. */
export function LoginForm() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!username.trim()) next.username = "Vui lòng nhập tên đăng nhập"
    if (!password) next.password = "Vui lòng nhập mật khẩu"
    setErrors(next)
    if (next.username || next.password) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    navigate("/", { replace: true })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-xs font-medium text-slate-200">Tên đăng nhập</label>
        <input id="username" autoComplete="username" autoFocus value={username} placeholder="Nhập tên đăng nhập"
          aria-invalid={!!errors.username || undefined} aria-describedby={errors.username ? "username-error" : undefined}
          onChange={(e) => setUsername(e.target.value)} className={field} />
        {errors.username && <p id="username-error" className="text-xs text-red-400">{errors.username}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-slate-200">Mật khẩu</label>
        <div className="relative">
          <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} placeholder="••••••••"
            aria-invalid={!!errors.password || undefined} aria-describedby={errors.password ? "password-error" : undefined}
            onChange={(e) => setPassword(e.target.value)} className={cn(field, "pr-9")} />
          <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute inset-y-0 right-0 grid w-9 place-items-center text-slate-400 hover:text-slate-200">
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p id="password-error" className="text-xs text-red-400">{errors.password}</p>}
      </div>
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} className="border-slate-500 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500" />
          Ghi nhớ đăng nhập
        </label>
        <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-medium text-teal-400 hover:text-teal-300">Quên mật khẩu?</a>
      </div>
      <button type="submit" disabled={submitting}
        className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#3b6ef0] to-[#0ea5a5] text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none disabled:opacity-70">
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Đăng nhập
      </button>
    </form>
  )
}
