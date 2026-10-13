import { Link } from "react-router"

import { Button } from "@workspace/ui/components/button"

export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <h1 className="text-5xl font-semibold">404<span className="sr-only"> — Không tìm thấy trang</span></h1>
      <p className="text-sm text-muted-foreground">Không tìm thấy trang.</p>
      <Button asChild size="sm"><Link to="/">Về trang chủ</Link></Button>
    </div>
  )
}
