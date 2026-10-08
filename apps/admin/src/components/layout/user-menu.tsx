import { useState } from "react"
import { Link } from "react-router"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { initialsOf, ShortcutsDialog, useProfile } from "@/features/profile"

/** Round avatar at the right end of the app header; account menu like the reference. */
export function UserMenu() {
  const { fullName, email } = useProfile()
  const [shortcuts, setShortcuts] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Tài khoản" className="size-7 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="size-7">
            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-indigo-600 text-xs text-white">{initialsOf(fullName)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium">{fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/profile">Hồ sơ</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/profile?tab=settings">Cài đặt</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShortcuts(true)}>Phím tắt</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" asChild><Link to="/login">Đăng xuất</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
    </>
  )
}
