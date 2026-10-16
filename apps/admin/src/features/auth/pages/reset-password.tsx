import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Loading03Icon } from "@hugeicons/core-free-icons"

import { authApi, InvalidResetTokenError } from "../api/auth.api"
import { AuthNotice } from "../components/auth-notice"
import { AuthShell } from "../components/auth-shell"
import { authError, authLabel, authLink, authSubmit } from "../components/auth-styles"
import { PasswordInput } from "../components/password-input"

const MIN_LENGTH = 6
const INVALID_TOKEN = "Liên kết đặt lại không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới."

type Errors = { password?: string; confirm?: string }

function BackToLogin() {
  return (
    <Link to="/login" className={`inline-flex items-center gap-1 ${authLink}`}>
      <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
      Quay lại đăng nhập
    </Link>
  )
}

/** Set a new password from an emailed `?token=` link. UI-only: the request is mocked. */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token")?.trim() ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "done" | "invalid">(token ? "idle" : "invalid")

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (password.length < MIN_LENGTH) next.password = "Mật khẩu phải có ít nhất 6 ký tự."
    if (confirm !== password) next.confirm = "Mật khẩu không khớp."
    setErrors(next)
    if (next.password || next.confirm) return
    setSubmitting(true)
    try {
      await authApi.resetPassword(token, password)
      setStatus("done")
    } catch (err) {
      if (err instanceof InvalidResetTokenError) setStatus("invalid")
      else throw err
    } finally {
      setSubmitting(false)
    }
  }

  const shell = { title: "Tạo mật khẩu mới", subtitle: "Chọn mật khẩu mạnh để bảo vệ tài khoản của bạn.", footer: <BackToLogin /> }

  if (status === "invalid") {
    return (
      <AuthShell {...shell}>
        <div className="flex flex-col gap-5">
          <AuthNotice tone="error">{INVALID_TOKEN}</AuthNotice>
          <Link to="/forgot-password" className={authSubmit}>Gửi liên kết đặt lại</Link>
        </div>
      </AuthShell>
    )
  }

  if (status === "done") {
    return (
      <AuthShell {...shell}>
        <div className="flex flex-col gap-5">
          <AuthNotice tone="success">Đã cập nhật mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.</AuthNotice>
          <Link to="/login" replace className={authSubmit}>Đăng nhập</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell {...shell}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className={authLabel}>Mật khẩu mới</label>
          <PasswordInput id="new-password" autoComplete="new-password" autoFocus value={password} placeholder="Tối thiểu 6 ký tự"
            aria-invalid={!!errors.password || undefined} aria-describedby={errors.password ? "new-password-error" : undefined}
            onChange={(e) => setPassword(e.target.value)} />
          {errors.password && <p id="new-password-error" className={authError}>{errors.password}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className={authLabel}>Xác nhận mật khẩu</label>
          <PasswordInput id="confirm-password" autoComplete="new-password" value={confirm} placeholder="Nhập lại mật khẩu mới"
            aria-invalid={!!errors.confirm || undefined} aria-describedby={errors.confirm ? "confirm-password-error" : undefined}
            onChange={(e) => setConfirm(e.target.value)} />
          {errors.confirm && <p id="confirm-password-error" className={authError}>{errors.confirm}</p>}
        </div>
        <button type="submit" disabled={submitting} className={authSubmit}>
          {submitting && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
          {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
        </button>
      </form>
    </AuthShell>
  )
}
