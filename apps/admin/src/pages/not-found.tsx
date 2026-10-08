import { Link } from "react-router"

import { Button } from "@workspace/ui/components/button"

export function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <p className="text-5xl font-semibold">404</p>
      <p className="text-sm text-muted-foreground">Không tìm thấy trang.</p>
      <Button asChild size="sm"><Link to="/">Về trang chủ</Link></Button>
    </div>
  )
}
