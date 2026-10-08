import { Check } from "lucide-react"

import { BRANDING } from "@/config/branding"
import { LoginForm } from "../components/login-form"

const HIGHLIGHTS = [
  { title: "Active Tables", text: "Quản lý dữ liệu cấu trúc với schema linh hoạt", tone: "bg-emerald-50 text-emerald-600" },
  { title: "Workflow Automation", text: "Tự động hóa quy trình làm việc hiệu quả", tone: "bg-blue-50 text-blue-600" },
]
// Faint plus-pattern texture, same idea as the reference background.
const PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"

/** Dark split login (reference layout): product pitch on the left, glass card form on the right. */
export function LoginPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: PATTERN }} />

      <div className="relative mx-auto grid min-h-svh max-w-[1400px] items-center gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_448px] lg:gap-16 lg:px-16">
        <section className="max-lg:hidden">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 text-lg font-bold text-white shadow-lg shadow-blue-500/20">{BRANDING.name[0]}</span>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{BRANDING.name}</p>
              <p className="text-xs text-blue-400">Low-Code Platform</p>
            </div>
          </div>
          <h1 className="mt-10 text-2xl font-semibold">
            Chào mừng trở lại
            <span className="block bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">Nền tảng số hóa quy trình</span>
          </h1>
          <p className="mt-6 max-w-[480px] text-base leading-relaxed text-slate-400">Quản trị workspace, tự động hóa workflow và vận hành dữ liệu Active Table.</p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${h.tone}`}><Check className="size-3.5" /></span>
                <span>
                  <span className="block font-semibold">{h.title}</span>
                  <span className="block text-xs text-slate-400">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="w-full rounded-2xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-sm max-lg:mx-auto max-lg:max-w-[448px]">
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 text-sm font-bold text-white">{BRANDING.name[0]}</span>
            <span className="font-semibold">{BRANDING.name}</span>
          </div>
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold">Đăng nhập</h2>
            <p className="mt-2 text-xs text-slate-300">Truy cập tài khoản của bạn</p>
          </div>
          <LoginForm />
          <div className="mt-6 flex items-center justify-center gap-3 border-t border-slate-700 pt-6 text-xs text-slate-500">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Chính sách bảo mật</a>
            <span aria-hidden className="size-1 rounded-full bg-slate-600" />
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Điều khoản dịch vụ</a>
          </div>
        </section>
      </div>
    </div>
  )
}
