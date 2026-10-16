import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Loading03Icon, Mail01Icon } from "@hugeicons/core-free-icons"

import { authApi } from "../api/auth.api"
import { AuthNotice } from "../components/auth-notice"
import { AuthShell } from "../components/auth-shell"
import { authError, authField, authLabel, authLink, authSubmit } from "../components/auth-styles"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function BackToLogin() {
  return (
    <Link to="/login" className={`inline-flex items-center gap-1 ${authLink}`}>
      <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
      Quay lại đăng nhập
    </Link>
  )
}

/** Request a password-reset link by email. UI-only: the request is mocked. */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string>()
  const [submitError, setSubmitError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    const next = !value ? "Vui lòng nhập email." : !EMAIL_RE.test(value) ? "Vui lòng nhập email hợp lệ." : undefined
    setError(next)
    setSubmitError(undefined)
    if (next) return
    setSubmitting(true)
    try {
      await authApi.requestPasswordReset(value)
      setSent(true)
    } catch {
      setSubmitError("Không thể gửi yêu cầu. Vui lòng thử lại.")
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthShell title="Hãy kiểm tra email của bạn" subtitle="Nếu tồn tại tài khoản với email này, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu." footer={<BackToLogin />}>
        <div className="flex justify-center">
          <span className="grid size-12 place-items-center rounded-full bg-emerald-500/10 text-emerald-400">
            <HugeiconsIcon icon={Mail01Icon} className="size-6" />
          </span>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Đặt lại mật khẩu" subtitle="Nhập email gắn với tài khoản của bạn. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu." footer={<BackToLogin />}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {submitError && <AuthNotice tone="error">{submitError}</AuthNotice>}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={authLabel}>Email</label>
          <input id="email" type="email" autoComplete="email" autoFocus value={email} placeholder="ban@congty.com"
            aria-invalid={!!error || undefined} aria-describedby={error ? "email-error" : undefined}
            onChange={(e) => setEmail(e.target.value)} className={authField} />
          {error && <p id="email-error" className={authError}>{error}</p>}
        </div>
        <button type="submit" disabled={submitting} className={authSubmit}>
          {submitting && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
          {submitting ? "Đang gửi..." : "Gửi liên kết đặt lại"}
        </button>
      </form>
    </AuthShell>
  )
}
