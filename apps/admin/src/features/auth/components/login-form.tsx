import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"

import { cn } from "@workspace/ui/lib/utils"

type Errors = { username?: string; password?: string }

const field =
  "h-12 w-full rounded-md border border-[#e5e9f0] bg-[#e9eefc] px-4 text-sm text-[#252b36] outline-none placeholder:text-[#87909e] transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 aria-invalid:border-red-500"

/** UI-only: validates locally, fakes a request, then enters the app. No real auth yet. */
export function LoginForm() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!username.trim()) next.username = "Vui lòng nhập tài khoản"
    if (!password) next.password = "Vui lòng nhập mật khẩu"
    setErrors(next)
    if (next.username || next.password) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    navigate("/", { replace: true })
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm text-[#5b6472]">Tài khoản</label>
        <input id="username" autoComplete="username" autoFocus value={username} placeholder="Nhập tài khoản"
          aria-invalid={!!errors.username || undefined} aria-describedby={errors.username ? "username-error" : undefined}
          onChange={(e) => setUsername(e.target.value)} className={field} />
        {errors.username && <p id="username-error" className="text-xs text-red-600">{errors.username}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm text-[#5b6472]">Mật khẩu</label>
        <div className="relative">
          <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} placeholder="Nhập mật khẩu"
            aria-invalid={!!errors.password || undefined} aria-describedby={errors.password ? "password-error" : undefined}
            onChange={(e) => setPassword(e.target.value)} className={cn(field, "pr-11")} />
          <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#7b8492] hover:text-[#364152]">
            {showPassword ? <HugeiconsIcon icon={ViewOffIcon} className="size-4" /> : <HugeiconsIcon icon={ViewIcon} className="size-4" />}
          </button>
        </div>
        {errors.password && <p id="password-error" className="text-xs text-red-600">{errors.password}</p>}
        <a href="#" onClick={(e) => e.preventDefault()} className="mt-1 w-fit text-sm font-medium text-brand hover:underline">Quên mật khẩu</a>
      </div>
      <button type="submit" disabled={submitting}
        className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-white transition-[filter] hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-70">
        {submitting && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
        Đăng nhập
      </button>
    </form>
  )
}
