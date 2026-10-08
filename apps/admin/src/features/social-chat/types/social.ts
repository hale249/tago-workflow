export type Channel = "facebook" | "instagram" | "whatsapp" | "zalo"
export type Connection = { id: string; channel: Channel; name: string }
/** Facebook page / Instagram account / WhatsApp number / Zalo OA behind a connection. */
export type ChannelPage = { id: string; connectionId: string; name: string }
export type Customer = { name: string; handle: string; color: string }
export type Conversation = {
  id: string
  pageId: string
  customer: Customer
  assigneeId?: string
  labelIds: string[]
  unread: number
  lastMessageAt: string
  linkedRecordId?: string
}
export type Message = { id: string; conversationId: string; from: "customer" | "agent"; authorId?: string; text: string; at: string; failed?: boolean }
export type Label = { id: string; name: string; color: string }
export type TemplateGroup = { id: string; name: string }
export type Template = { id: string; groupId?: string; name: string; content: string }
/** Per-channel Social Chat settings ("Cài đặt" tab). */
export type ChannelSettings = { linkedTableId: string; assigneeIds: string[]; templateGroups: TemplateGroup[]; templates: Template[]; labels: Label[] }
