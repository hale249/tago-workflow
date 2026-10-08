import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Kbd } from "@/components/kbd"

const GROUPS: { title: string; items: [string[], string][] }[] = [
  { title: "Chung", items: [[["⌘", "B"], "Thu gọn / mở rộng sidebar"], [["/"], "Tìm kiếm trong không gian làm việc"], [["Esc"], "Đóng hộp thoại, ngăn xem nhanh"]] },
  { title: "Bản ghi", items: [[["↑"], "Bản ghi trước (khi đang xem nhanh)"], [["↓"], "Bản ghi sau (khi đang xem nhanh)"], [["⌘", "Click"], "Mở bản ghi ở tab mới"]] },
  { title: "Bình luận & Workflow", items: [[["Ctrl", "Enter"], "Gửi bình luận"], [["⌘", "Lăn chuột"], "Phóng to / thu nhỏ canvas workflow"]] },
]

/** "Phím tắt" dialog (avatar menu and profile settings). */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Phím tắt</DialogTitle>
          <DialogDescription>Các phím tắt có sẵn trong ứng dụng</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{g.title}</p>
              <ul className="divide-y rounded-md border">
                {g.items.map(([keys, label]) => (
                  <li key={label} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span>{label}</span>
                    <span className="flex shrink-0 items-center gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
