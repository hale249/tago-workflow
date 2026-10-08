import type { Channel, ChannelPage, ChannelSettings, Connection, Conversation, Message } from "../types/social"

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
const COLORS = ["#2563eb", "#db2777", "#16a34a", "#ea580c", "#7c3aed", "#0891b2"]

export const SEED_CONNECTIONS: Connection[] = [
  { id: "cn_fb", channel: "facebook", name: "Facebook – Motor Anh Quốc" },
  { id: "cn_ig", channel: "instagram", name: "Instagram – motoranhquoc" },
  { id: "cn_wa", channel: "whatsapp", name: "WhatsApp Business" },
  { id: "cn_zl", channel: "zalo", name: "Zalo OA – Motor Anh Quốc" },
]
export const SEED_PAGES: ChannelPage[] = [
  { id: "pg_fb_main", connectionId: "cn_fb", name: "Motor Anh Quốc" },
  { id: "pg_fb_parts", connectionId: "cn_fb", name: "Phụ tùng Anh Quốc" },
  { id: "pg_ig", connectionId: "cn_ig", name: "@motoranhquoc" },
  { id: "pg_wa", connectionId: "cn_wa", name: "+84 912 000 555" },
  { id: "pg_zl", connectionId: "cn_zl", name: "Motor Anh Quốc OA" },
]

const PEOPLE: [string, string][] = [
  ["Nguyễn Hoàng Nam", "nam.nguyen"], ["Trần Thu Hà", "thuha.tran"], ["Phạm Minh Đức", "duc.pm"],
  ["Vũ Thị Mai", "mai.vu"], ["Lê Quốc Bảo", "quocbao"], ["Đỗ Thanh Tùng", "tung.do"],
  ["Hoàng Gia Huy", "giahuy"], ["Ngô Bích Ngọc", "ngoc.ngo"], ["Bùi Anh Tuấn", "tuan.bui"],
  ["Đặng Khánh Linh", "khanhlinh"], ["Phan Văn Lộc", "loc.phan"], ["Mai Phương Thảo", "thao.mai"],
]
const THREADS: string[][] = [
  ["Shop ơi xe Air Blade 160 còn màu đen không ạ?", "Dạ còn anh ạ, hiện có sẵn tại cửa hàng.", "Giá lăn bánh bao nhiêu vậy shop?"],
  ["Em muốn đặt lịch bảo dưỡng cuối tuần này", "Dạ chị muốn đặt sáng hay chiều ạ?", "Sáng thứ 7 nhé"],
  ["Có hỗ trợ trả góp không shop?", "Dạ có ạ, trả trước từ 20%."],
  ["Mình đã nhận xe rồi, cảm ơn shop nhiều!"],
  ["Cho hỏi phụ tùng má phanh Vision giá bao nhiêu?", "Dạ 180.000đ một bộ ạ.", "Ok shop giữ giúp mình 1 bộ"],
  ["Shop mở cửa đến mấy giờ?"],
]

const pagesOf = (ch: Channel) => SEED_PAGES.filter((p) => SEED_CONNECTIONS.find((c) => c.id === p.connectionId)?.channel === ch)

export const SEED_CONVERSATIONS: Conversation[] = []
export const SEED_MESSAGES: Message[] = []
// Each channel gets its own customers (3 each) so the unified inbox doesn't show duplicates.
;(["facebook", "instagram", "whatsapp", "zalo"] as Channel[]).forEach((ch, ci) => {
  const page = pagesOf(ch)[0]!
  PEOPLE.slice(ci * 3, ci * 3 + 3).forEach(([name, handle], k) => {
    const i = (ci + k * 2) % THREADS.length
    const id = `cv_${ch}_${k}`
    const thread = THREADS[i]!
    const last = 5 + (ci * 3 + k) * 37
    SEED_CONVERSATIONS.push({
      id, pageId: page.id, customer: { name, handle, color: COLORS[i % COLORS.length]! },
      assigneeId: i % 3 === 0 ? "u_me" : i % 3 === 1 ? "u_lan" : undefined,
      labelIds: i === 0 ? ["lb_hot"] : i === 2 ? ["lb_installment"] : [],
      unread: thread.length % 2 === 1 && i < 4 ? 1 : 0, lastMessageAt: ago(last),
    })
    thread.forEach((text, k) => SEED_MESSAGES.push({
      id: `${id}_m${k}`, conversationId: id, from: k % 2 === 0 ? "customer" : "agent", authorId: k % 2 ? "u_me" : undefined,
      text, at: ago(last + (thread.length - 1 - k) * 6),
    }))
  })
})

export const defaultSettings = (): ChannelSettings => ({
  linkedTableId: "t_customers",
  assigneeIds: ["u_me", "u_lan"],
  templateGroups: [{ id: "tg_sales", name: "Bán hàng" }],
  templates: [
    { id: "tp_hi", groupId: "tg_sales", name: "Chào hỏi", content: "Dạ em chào anh/chị, em có thể hỗ trợ gì ạ?" },
    { id: "tp_price", groupId: "tg_sales", name: "Báo giá", content: "Dạ giá xe hiện tại là … , anh/chị để lại SĐT để em tư vấn chi tiết nhé." },
    { id: "tp_thanks", name: "Cảm ơn", content: "Cảm ơn anh/chị đã quan tâm Motor Anh Quốc ạ!" },
  ],
  labels: [{ id: "lb_hot", name: "Khách nóng", color: "#dc2626" }, { id: "lb_installment", name: "Trả góp", color: "#2563eb" }],
})
