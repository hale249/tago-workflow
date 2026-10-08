import { BRANDING } from "@/config/branding"
import { BrandPanel } from "../components/brand-panel"
import { LoginForm } from "../components/login-form"

export function LoginPage() {
  return (
    <div className="grid min-h-svh bg-background p-3 lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-brand text-xs text-white">{BRANDING.name[0]}</span>
          {BRANDING.name}
        </div>
        <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 mb-8 text-sm text-muted-foreground">Sign in to your account to continue.</p>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="#" onClick={(e) => e.preventDefault()} className="font-medium text-brand underline-offset-2 hover:underline">
              Contact your admin
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
