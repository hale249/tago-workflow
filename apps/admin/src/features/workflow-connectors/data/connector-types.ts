export type ConfigField = { name: string; label: string; type: "text" | "number" | "password" | "table"; required?: boolean }
export type ConnectorType = { type: string; name: string; description: string; oauth: boolean; group: string; fields: ConfigField[] }
export type ConnectorStatus = "connected" | "disconnected" | "error" | "expired"
export type Connector = { id: string; name: string; connectorType: string; description: string; config: Record<string, string>; status: ConnectorStatus; createdAt: string; updatedAt: string }

const f = (name: string, label: string, required = true, type: ConfigField["type"] = "text"): ConfigField => ({ name, label, type, required })
const OAUTH_FB = [f("accessToken", "Access token"), f("pages", "Trang đã cấp quyền", false)]
const OAUTH_G = [f("access_token", "Access token", false), f("refresh_token", "Refresh token", false), f("scope", "Phạm vi quyền", false)]

/** Connector catalog — order, names and descriptions mirror the reference "Chọn loại Connector" grid. */
const FB = (type: string, name: string, description: string): ConnectorType => ({ type, name, description, oauth: true, group: "Facebook", fields: OAUTH_FB })
const G = (type: string, name: string, description: string): ConnectorType => ({ type, name, description, oauth: true, group: "Google", fields: OAUTH_G })
const SHIP = (type: string, name: string, description: string): ConnectorType => ({ type, name, description, oauth: false, group: "Vận chuyển", fields: [f("apiKey", "API key"), f("apiSecret", "API secret", true, "password")] })
export const CONNECTOR_TYPES: ConnectorType[] = [
  { type: "SMTP", name: "SMTP", description: "Kết nối với máy chủ SMTP để gửi email.", oauth: false, group: "Email", fields: [f("host", "Máy chủ"), f("port", "Cổng", true, "number"), f("username", "Tài khoản"), f("password", "Mật khẩu", true, "password"), f("from_email", "Email gửi"), f("from_name", "Tên người gửi", false)] },
  FB("FACEBOOK_LOGIN", "Facebook Login", "Đăng nhập bằng Facebook."),
  FB("FACEBOOK_PAGE", "Facebook Page Content", "Đăng bài và quản lý nội dung Page."),
  FB("FACEBOOK_PAGE_MESSAGING", "Facebook Page Messaging", "Chatbot và trả lời tin nhắn Facebook Page."),
  FB("FACEBOOK_ADS", "Facebook Ads", "Quản lý quảng cáo Facebook."),
  FB("FACEBOOK_INSIGHTS_ANALYTICS", "Facebook Insights", "Xem báo cáo và thống kê Facebook."),
  { type: "WHATSAPP_CHAT", name: "WhatsApp Business", description: "Chatbot và trả lời tin nhắn WhatsApp Business.", oauth: true, group: "Mạng xã hội", fields: [f("accessToken", "Access token"), f("phoneNumbers", "Số điện thoại", false)] },
  { type: "INSTAGRAM_CHAT", name: "Instagram Chat", description: "Kết nối Instagram để chat và đồng bộ tin nhắn.", oauth: true, group: "Mạng xã hội", fields: [f("access_token", "Access token"), f("igBusinessAccountId", "Instagram Business ID", false)] },
  G("GOOGLE_PHOTOS", "Google Photos", "Tương tác với Google Photos để đọc, tải lên và chia sẻ ảnh."),
  G("GOOGLE_TASKS", "Google Tasks", "Tương tác với Google Tasks để quản lý danh sách công việc."),
  G("GOOGLE_CONTACTS", "Google Contacts", "Tương tác với Google Contacts để quản lý danh bạ."),
  G("GOOGLE_CALENDAR", "Google Calendar", "Tương tác với Google Calendar để quản lý lịch và sự kiện."),
  G("GOOGLE_GMAIL", "Google Gmail", "Tương tác với Gmail để đọc, soạn và gửi email."),
  G("GOOGLE_DRIVE", "Google Drive", "Tương tác với Google Drive để quản lý tệp và thư mục."),
  G("GOOGLE_SHEETS", "Google Sheets", "Tương tác với bảng tính Google."),
  { type: "ZALO_OA", name: "Zalo OA", description: "Kết nối với Zalo Official Account để gửi tin nhắn và quản lý khách hàng.", oauth: true, group: "Mạng xã hội", fields: [f("accessToken", "Access token", false), f("refreshToken", "Refresh token", false), f("oas", "OA đã kết nối", false)] },
  { type: "KIOTVIET", name: "Kiotviet", description: "Kết nối với Kiotviet để quản lý bán hàng và kho.", oauth: false, group: "Bán hàng", fields: [f("clientId", "Client ID"), f("clientSecret", "Client secret", true, "password"), f("retailerCode", "Mã cửa hàng")] },
  { type: "HARAVAN", name: "Haravan", description: "Kết nối với Haravan để quản lý thương mại điện tử.", oauth: false, group: "Bán hàng", fields: [f("apiKey", "API key"), f("apiSecret", "API secret", true, "password"), f("storeUrl", "Địa chỉ cửa hàng")] },
  SHIP("VIETTEL_POST", "Viettel Post", "Kết nối với Viettel Post để quản lý vận chuyển."),
  SHIP("EMS", "EMS", "Kết nối với EMS để quản lý dịch vụ giao hàng."),
  SHIP("LALAMOVE", "Lalamove", "Kết nối với Lalamove để quản lý dịch vụ vận chuyển."),
  { type: "EINVOICE_VNPT", name: "Hóa đơn điện tử VNPT", description: "Kết nối với VNPT E-Invoice (API REST SaaS) để phát hành và quản lý hóa đơn điện tử.", oauth: false, group: "Kế toán", fields: [f("url", "URL dịch vụ"), f("clientId", "Client ID"), f("account", "Tài khoản"), f("password", "Mật khẩu", true, "password")] },
  { type: "ACTIVE_TABLE", name: "Bảng", description: "Kết nối với bảng để quản lý dữ liệu", oauth: false, group: "Nội bộ", fields: [f("tableId", "ID Bảng", true, "table"), f("tableKey", "Khóa mã hóa bảng", true, "password")] },
  { type: "AI_PROVIDER", name: "AI Provider", description: "Kết nối với AI Provider (OpenAI, Google Gemini, Anthropic Claude, v.v.) để sử dụng AI trong workflow.", oauth: false, group: "Nội bộ", fields: [f("provider", "Nhà cung cấp"), f("apiKey", "API key", true, "password"), f("model", "Model", false), f("baseUrl", "Base URL", false)] },
]
export const connectorType = (t: string) => CONNECTOR_TYPES.find((x) => x.type === t)

export const STATUS: Record<ConnectorStatus, { label: string; short: string; cls: string }> = {
  connected: { label: "Đang hoạt động", short: "OK", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  disconnected: { label: "Chưa kết nối", short: "—", cls: "bg-muted text-muted-foreground" },
  error: { label: "Lỗi kết nối", short: "Lỗi", cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
  expired: { label: "Cần kết nối lại", short: "Hết hạn", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
}
