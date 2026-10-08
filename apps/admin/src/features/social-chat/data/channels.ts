import { Camera, MessageCircle, MessageSquareText, MessagesSquare, type LucideIcon } from "lucide-react"

import type { Channel } from "../types/social"

/** Wording differs per channel the same way the reference does (page / account / number / OA). */
export const CHANNELS: Record<Channel, { name: string; icon: LucideIcon; title: string; pageLabel: string; pagePlaceholder: string; pickFirst: string; color: string }> = {
  facebook: { name: "Facebook", icon: MessageSquareText, title: "Facebook Page Inbox", pageLabel: "Trang", pagePlaceholder: "Chọn trang…", pickFirst: "Hãy chọn trang trước", color: "#1877f2" },
  instagram: { name: "Instagram", icon: Camera, title: "Instagram Inbox", pageLabel: "Tài khoản", pagePlaceholder: "Chọn tài khoản…", pickFirst: "Hãy chọn tài khoản trước", color: "#d62976" },
  whatsapp: { name: "WhatsApp", icon: MessageCircle, title: "WhatsApp Inbox", pageLabel: "Số điện thoại", pagePlaceholder: "Chọn số điện thoại…", pickFirst: "Hãy chọn số điện thoại trước", color: "#25d366" },
  zalo: { name: "Zalo OA", icon: MessagesSquare, title: "Zalo OA Inbox", pageLabel: "Official Account", pagePlaceholder: "Chọn Official Account…", pickFirst: "Hãy chọn OA trước", color: "#0068ff" },
}
export const LABEL_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#dc2626", "#7c3aed", "#0891b2", "#ca8a04", "#64748b"]

export const CHANNEL_IDS = Object.keys(CHANNELS) as Channel[]
