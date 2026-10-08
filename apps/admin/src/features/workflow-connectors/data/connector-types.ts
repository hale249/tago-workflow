export type ConfigField = { name: string; label: string; type: "text" | "number" | "password"; required?: boolean }
export type ConnectorType = { type: string; name: string; description: string; oauth: boolean; group: string; fields: ConfigField[] }
export type ConnectorStatus = "connected" | "disconnected" | "error" | "expired"
export type Connector = { id: string; name: string; connectorType: string; description: string; config: Record<string, string>; status: ConnectorStatus; createdAt: string; updatedAt: string }

const f = (name: string, label: string, required = true, type: ConfigField["type"] = "text"): ConfigField => ({ name, label, type, required })
const OAUTH_FB = [f("accessToken", "Access token"), f("pages", "Trang đã cấp quyền", false)]
const OAUTH_G = [f("access_token", "Access token", false), f("refresh_token", "Refresh token", false), f("scope", "Phạm vi quyền", false)]

/** Connector catalog (types mirror the reference API; descriptions are our own). */
export const CONNECTOR_TYPES: ConnectorType[] = [
  { type: "ACTIVE_TABLE", name: "Bảng", description: "Đọc/ghi bản ghi của một bảng trong workspace", oauth: false, group: "Nội bộ", fields: [f("tableId", "Bảng"), f("tableKey", "Khoá truy cập bảng", true, "password")] },
  { type: "AI_PROVIDER", name: "AI Provider", description: "Kết nối mô hình AI cho Think Agent / tạo ảnh", oauth: false, group: "Nội bộ", fields: [f("provider", "Nhà cung cấp"), f("apiKey", "API key", true, "password"), f("model", "Model", false), f("baseUrl", "Base URL", false)] },
  { type: "SMTP", name: "SMTP", description: "Gửi email qua máy chủ SMTP", oauth: false, group: "Email", fields: [f("host", "Máy chủ"), f("port", "Cổng", true, "number"), f("username", "Tài khoản"), f("password", "Mật khẩu", true, "password"), f("from_email", "Email gửi"), f("from_name", "Tên người gửi", false)] },
  ...(["FACEBOOK_LOGIN:Facebook Login:Đăng nhập Facebook để lấy quyền truy cập", "FACEBOOK_PAGE:Facebook Page Content:Đăng bài, đọc bình luận trên Page", "FACEBOOK_PAGE_MESSAGING:Facebook Page Messaging:Nhắn tin với khách qua Page", "FACEBOOK_ADS:Facebook Ads:Đọc chiến dịch và số liệu quảng cáo", "FACEBOOK_INSIGHTS_ANALYTICS:Facebook Insights:Số liệu tương tác của Page"].map((s) => {
    const [type, name, description] = s.split(":")
    return { type, name, description, oauth: true, group: "Facebook", fields: OAUTH_FB }
  })),
  { type: "INSTAGRAM_CHAT", name: "Instagram Chat", description: "Tin nhắn Instagram Direct", oauth: true, group: "Mạng xã hội", fields: [f("access_token", "Access token"), f("igBusinessAccountId", "Instagram Business ID", false)] },
  { type: "WHATSAPP_CHAT", name: "WhatsApp Business", description: "Hội thoại WhatsApp Business", oauth: true, group: "Mạng xã hội", fields: [f("accessToken", "Access token"), f("phoneNumbers", "Số điện thoại", false)] },
  { type: "ZALO_OA", name: "Zalo OA", description: "Official Account Zalo", oauth: true, group: "Mạng xã hội", fields: [f("accessToken", "Access token", false), f("refreshToken", "Refresh token", false), f("oas", "OA đã kết nối", false)] },
  ...(["GOOGLE_SHEETS:Google Sheets", "GOOGLE_CALENDAR:Google Calendar", "GOOGLE_DRIVE:Google Drive", "GOOGLE_GMAIL:Google Gmail", "GOOGLE_TASKS:Google Tasks", "GOOGLE_PHOTOS:Google Photos", "GOOGLE_CONTACTS:Google Contacts"].map((s) => {
    const [type, name] = s.split(":")
    return { type, name, description: `Truy cập ${name} của tài khoản Google`, oauth: true, group: "Google", fields: OAUTH_G }
  })),
  { type: "KIOTVIET", name: "Kiotviet", description: "Đồng bộ đơn và hàng hoá Kiotviet", oauth: false, group: "Bán hàng", fields: [f("clientId", "Client ID"), f("clientSecret", "Client secret", true, "password"), f("retailerCode", "Mã cửa hàng")] },
  { type: "HARAVAN", name: "Haravan", description: "Đồng bộ đơn hàng Haravan", oauth: false, group: "Bán hàng", fields: [f("apiKey", "API key"), f("apiSecret", "API secret", true, "password"), f("storeUrl", "Địa chỉ cửa hàng")] },
  ...(["VIETTEL_POST:Viettel Post", "EMS:EMS", "LALAMOVE:Lalamove"].map((s) => {
    const [type, name] = s.split(":")
    return { type, name, description: `Tạo và theo dõi vận đơn ${name}`, oauth: false, group: "Vận chuyển", fields: [f("apiKey", "API key"), f("apiSecret", "API secret", true, "password")] }
  })),
  { type: "EINVOICE_VNPT", name: "Hóa đơn điện tử VNPT", description: "Phát hành hoá đơn điện tử", oauth: false, group: "Kế toán", fields: [f("url", "URL dịch vụ"), f("clientId", "Client ID"), f("account", "Tài khoản"), f("password", "Mật khẩu", true, "password")] },
]
export const connectorType = (t: string) => CONNECTOR_TYPES.find((x) => x.type === t)

export const STATUS: Record<ConnectorStatus, { label: string; short: string; cls: string }> = {
  connected: { label: "Đang hoạt động", short: "OK", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  disconnected: { label: "Chưa kết nối", short: "—", cls: "bg-muted text-muted-foreground" },
  error: { label: "Lỗi kết nối", short: "Lỗi", cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
  expired: { label: "Cần kết nối lại", short: "Hết hạn", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
}
