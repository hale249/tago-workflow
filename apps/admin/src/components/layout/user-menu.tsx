import { useState } from "react"
import { Link } from "react-router"

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ShortcutsDialog, useProfile } from "@/features/profile"

/** Neutral placeholder shown when the user has no photo (the reference's default avatar, same in both themes). */
function DefaultAvatar() {
  return (
    <svg viewBox="0 0 28 28" className="size-full" aria-hidden="true">
      <defs>
        <clipPath id="default-avatar-clip"><circle cx="14" cy="14" r="10" /></clipPath>
      </defs>
      <circle cx="14" cy="14" r="14" fill="#fff" />
      <circle cx="14" cy="14" r="10" fill="#f6f6f6" />
      <g clipPath="url(#default-avatar-clip)" fill="#e1e2e4">
        <circle cx="14" cy="12.5" r="3.25" />
        <ellipse cx="14" cy="22.5" rx="6" ry="4.5" />
      </g>
    </svg>
  )
}

/** Round avatar at the right end of the app header; account menu like the reference. */
export function UserMenu() {
  const { fullName, email, avatarUrl } = useProfile()
  const [shortcuts, setShortcuts] = useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Tài khoản" className="size-7 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="size-7">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="bg-transparent"><DefaultAvatar /></AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center justify-start gap-2 p-2 font-normal">
            <div className="flex min-w-0 flex-col space-y-1 leading-none">
              <p className="font-medium">{fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer"><Link to="/profile">Hồ sơ</Link></DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer"><Link to="/profile?tab=settings">Cài đặt</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onSelect={() => setShortcuts(true)}>Phím tắt</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer text-destructive focus:text-destructive"><Link to="/login">Đăng xuất</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
    </>
  )
}
