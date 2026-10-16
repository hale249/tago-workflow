import { type IconSvgElement } from "@hugeicons/react"
import { BubbleChatIcon, Camera01Icon, MessageMultiple01Icon, MessageMultiple02Icon } from "@hugeicons/core-free-icons"

import type { Channel } from "../types/social"

/** Wording differs per channel the same way the reference does (page / account / number / OA). */
export const CHANNELS: Record<Channel, { name: string; icon: IconSvgElement; title: string; pageLabel: string; pagePlaceholder: string; pickFirst: string; noPages: string; color: string }> = {
  facebook: { name: "Facebook", icon: MessageMultiple01Icon, title: "Facebook Page Inbox", pageLabel: "Trang", pagePlaceholder: "Chọn trang Facebook…", pickFirst: "Hãy chọn trang trước", noPages: "Chưa có trang", color: "#1877f2" },
  instagram: { name: "Instagram", icon: Camera01Icon, title: "Instagram Inbox", pageLabel: "Tài khoản", pagePlaceholder: "Chọn tài khoản Instagram…", pickFirst: "Hãy chọn tài khoản Instagram trước", noPages: "Chưa có tài khoản Instagram", color: "#d62976" },
  whatsapp: { name: "WhatsApp", icon: BubbleChatIcon, title: "WhatsApp Inbox", pageLabel: "Số điện thoại", pagePlaceholder: "Chọn số điện thoại…", pickFirst: "Hãy chọn số điện thoại trước", noPages: "Chưa có số điện thoại", color: "#25d366" },
  zalo: { name: "Zalo OA", icon: MessageMultiple02Icon, title: "Zalo OA Inbox", pageLabel: "Official Account", pagePlaceholder: "Chọn Official Account…", pickFirst: "Hãy chọn OA trước", noPages: "Chưa có OA", color: "#0068ff" },
}
export const LABEL_COLORS = ["#2563eb", "#16a34a", "#ea580c", "#dc2626", "#7c3aed", "#0891b2", "#ca8a04", "#64748b"]

export const CHANNEL_IDS = Object.keys(CHANNELS) as Channel[]
