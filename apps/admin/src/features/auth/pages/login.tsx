import type { CSSProperties } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"

import { BRANDING } from "@/config/branding"
import { LoginForm } from "../components/login-form"

const HIGHLIGHTS = [
  {
    title: "Dữ liệu khách hàng tập trung",
    text: "Hợp nhất thông tin khách hàng trong hệ thống CDP.",
  },
  {
    title: "Tự động hóa tiếp thị",
    text: "Thiết lập chiến dịch và chăm sóc khách hàng theo từng hành trình.",
  },
]

function BrandMark() {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-xl font-bold text-white shadow-sm" aria-hidden="true">
      {BRANDING.name[0]}
    </span>
  )
}

export function LoginPage() {
  return (
    <main className="grid min-h-svh bg-[#f8f9fb] text-[#20242b] lg:grid-cols-2" style={{ "--brand": BRANDING.color } as CSSProperties}>
      <section className="flex items-center justify-center px-8 py-16 max-lg:hidden">
        <div className="w-full max-w-[600px]">
          <div className="mb-12 flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-[25px] leading-tight font-bold tracking-tight">{BRANDING.name}</p>
              <p className="text-xs font-medium text-[#667085]">Automation Marketing & CDP</p>
            </div>
          </div>

          <h1 className="max-w-[580px] text-[25px] leading-snug font-bold tracking-tight">
            Nền tảng Automation Marketing & CDP
          </h1>
          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight.title} className="flex items-start gap-2.5">
                <HugeiconsIcon icon={Tick02Icon} className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={2.5} />
                <div className="text-sm leading-6 text-[#667085]">
                  <p className="font-semibold text-[#566071]">{highlight.title}</p>
                  <p>{highlight.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center justify-center bg-[#f4f4f4] px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="text-xl font-bold tracking-tight">{BRANDING.name}</span>
          </div>
          <div className="mb-9 text-center sm:text-left">
            <h2 className="text-[22px] font-bold tracking-tight">{BRANDING.name} - Đăng nhập</h2>
            <p className="mt-2 text-sm text-[#505866]">Xin chào, vui lòng nhập thông tin đăng nhập</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
