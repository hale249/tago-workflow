import { AuthShell } from "../components/auth-shell"
import { LoginForm } from "../components/login-form"

/** Dark split login (reference layout): product pitch on the left, glass card form on the right. */
export function LoginPage() {
  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Truy cập tài khoản của bạn"
      footer={
        <>
          <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Chính sách bảo mật</a>
          <span aria-hidden className="size-1 rounded-full bg-slate-600" />
          <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Điều khoản dịch vụ</a>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
