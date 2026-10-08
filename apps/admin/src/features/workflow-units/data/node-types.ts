import {
  AlarmClock, Bell, BellRing, Bot, Braces, Calculator, CalendarDays, Camera, CircleStop, Contact, FileInput, FileUp, GitBranch, GitMerge, Globe, HardDrive,
  ImagePlus, Images, ListTodo, Mail, Megaphone, MessageCircle, MessageSquare, MessageSquareText, MessagesSquare, Newspaper, NotebookPen,
  PanelBottom, Phone, Repeat, Search, Sheet, ShieldCheck, Sigma, Table2, TimerReset, UserCog, Variable, Webhook, type LucideIcon,
} from "lucide-react"

export type NodeGroup = "Logic" | "Actions"
export type NodeOutput = { key: string; label: string }
export type NodeType = { type: string; label: string; description: string; group: NodeGroup; icon: LucideIcon; color: string; outputs?: NodeOutput[] }

// Reference palette: logic nodes are orange, every action node is green on the canvas
// (the side palette tints actions violet instead — see GROUP_CHIP).
const LOGIC = "#e0731f"
const ACTION = "#16764a"

/** Light tint behind a node's icon on the canvas. */
export const GROUP_SUBTLE: Record<NodeGroup, string> = { Logic: "#fff0e5", Actions: "#e6f3ec" }
/** Icon chip classes in the node palette. */
export const GROUP_CHIP: Record<NodeGroup, string> = {
  Logic: "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  Actions: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
}
/** Dot / handle / edge colour per branch key (reference: accent green / red / blue / orange). */
export const OUTPUT_COLOR: Record<string, string> = {
  true: "#16764a", false: "#d92d20", on_open: "#3b6ef0", on_click: "#3b6ef0", no_open: "#e0731f", no_click: "#d92d20",
}
/** Edges out of the trigger are teal, the rest take the source node's colour. */
export const START_EDGE = "#0ea5a5"

/** Palette: same order, names and descriptions as the reference node palette. */
export const NODE_TYPES: NodeType[] = [
  // Logic
  { type: "condition", label: "Điều kiện", description: "Phân nhánh if/then/else", group: "Logic", icon: GitBranch, color: LOGIC, outputs: [{ key: "true", label: "Đúng" }, { key: "false", label: "Sai" }] },
  { type: "loop", label: "Vòng lặp", description: "Lặp qua một tập hợp", group: "Logic", icon: Repeat, color: LOGIC },
  { type: "math", label: "Toán học", description: "Thực hiện phép tính toán học", group: "Logic", icon: Calculator, color: LOGIC },
  { type: "definition", label: "Biến số", description: "Định nghĩa biến", group: "Logic", icon: Variable, color: LOGIC },
  { type: "object_lookup", label: "Tra cứu Đối tượng", description: "Lấy giá trị từ đối tượng theo key", group: "Logic", icon: Search, color: LOGIC },
  { type: "collection_union", label: "Hợp nhất Mảng", description: "Hợp nhất nhiều mảng thành một, loại bỏ trùng lặp theo trường", group: "Logic", icon: GitMerge, color: LOGIC },
  { type: "validation", label: "Xác thực", description: "Kiểm tra tính hợp lệ của dữ liệu trong workflow", group: "Logic", icon: ShieldCheck, color: LOGIC },
  { type: "stop_with_error", label: "Dừng kèm lỗi", description: "Dừng workflow và trả về lỗi có cấu trúc", group: "Logic", icon: CircleStop, color: LOGIC },
  { type: "state_init", label: "Khởi tạo state", description: "Khởi tạo biến trạng thái có thể cập nhật nhiều lần", group: "Logic", icon: Braces, color: LOGIC },
  { type: "state_update", label: "Cập nhật state", description: "Cập nhật biến trạng thái đã khởi tạo", group: "Logic", icon: Sigma, color: LOGIC },
  { type: "loop_control", label: "Điều khiển vòng lặp", description: "Dừng vòng lặp (break) hoặc bỏ qua lượt hiện tại (continue)", group: "Logic", icon: TimerReset, color: LOGIC },
  // Actions
  { type: "table_operation", label: "Thao tác Bảng", description: "Thao tác CRUD trên Active Tables", group: "Actions", icon: Table2, color: ACTION },
  { type: "active_table_html_upload", label: "Tải lên file nội dung", description: "Tải lên file nội dung (HTML/PDF) vào bình luận hoặc field đính kèm", group: "Actions", icon: FileUp, color: ACTION },
  { type: "table_comment_create", label: "Tạo Bình luận", description: "Tạo bình luận trên bản ghi", group: "Actions", icon: MessageSquare, color: ACTION },
  { type: "table_comment_get_one", label: "Lấy Bình luận", description: "Lấy một bình luận từ bản ghi", group: "Actions", icon: MessageSquareText, color: ACTION },
  { type: "smtp_email", label: "Gửi Email", description: "Gửi email qua SMTP", group: "Actions", icon: Mail, color: ACTION, outputs: [{ key: "on_open", label: "Đã mở" }, { key: "on_click", label: "Đã click" }, { key: "no_open", label: "Không mở" }, { key: "no_click", label: "Không click" }] },
  { type: "google_sheet", label: "Google Sheet", description: "Đọc/ghi Google Sheets", group: "Actions", icon: Sheet, color: ACTION },
  { type: "google_calendar", label: "Google Calendar", description: "Quản lý sự kiện Google Calendar", group: "Actions", icon: CalendarDays, color: ACTION },
  { type: "google_drive", label: "Google Drive", description: "Quản lý tệp và thư mục Google Drive", group: "Actions", icon: HardDrive, color: ACTION },
  { type: "google_task", label: "Google Tasks", description: "Quản lý công việc Google Tasks", group: "Actions", icon: ListTodo, color: ACTION },
  { type: "google_gmail", label: "Google Gmail", description: "Gửi, đọc và quản lý email Gmail", group: "Actions", icon: Mail, color: ACTION },
  { type: "google_photos", label: "Google Photos", description: "Quản lý album và hình ảnh Google Photos", group: "Actions", icon: Images, color: ACTION },
  { type: "google_contacts", label: "Google Contacts", description: "Quản lý danh bạ Google Contacts", group: "Actions", icon: Contact, color: ACTION },
  { type: "facebook_page", label: "Facebook Page", description: "Quản lý bài viết và bình luận trên Facebook Page", group: "Actions", icon: Newspaper, color: ACTION },
  { type: "facebook_ads", label: "Facebook Ads", description: "Quản lý chiến dịch quảng cáo Facebook Ads", group: "Actions", icon: Megaphone, color: ACTION },
  { type: "facebook_page_messaging", label: "Facebook Messenger", description: "Gửi tin nhắn và quản lý hội thoại Facebook Messenger", group: "Actions", icon: MessageCircle, color: ACTION },
  { type: "facebook_chat", label: "Hội thoại Facebook Messenger", description: "Quản lý và trả lời hội thoại Facebook Messenger trong Social Chat", group: "Actions", icon: MessagesSquare, color: ACTION },
  { type: "zalo_chat", label: "Hội thoại Zalo OA", description: "Quản lý và trả lời hội thoại Zalo OA trong Social Chat", group: "Actions", icon: MessagesSquare, color: ACTION },
  { type: "instagram_chat", label: "Hội thoại Instagram Direct", description: "Quản lý và trả lời hội thoại Instagram Direct trong Social Chat", group: "Actions", icon: Camera, color: ACTION },
  { type: "whatsapp_chat", label: "Hội thoại WhatsApp Business", description: "Quản lý và trả lời hội thoại WhatsApp Business trong Social Chat", group: "Actions", icon: Phone, color: ACTION },
  { type: "think_agent", label: "Think Agent", description: "AI agent suy luận theo các bước và trả về kết quả có cấu trúc", group: "Actions", icon: Bot, color: ACTION },
  { type: "image_generation", label: "Tạo ảnh AI", description: "Tạo ảnh bằng AI qua kết nối AI Provider", group: "Actions", icon: ImagePlus, color: ACTION },
  { type: "api_call", label: "Gọi API", description: "Thực hiện HTTP API request", group: "Actions", icon: Globe, color: ACTION },
  { type: "user_operation", label: "Thao tác Người dùng", description: "Truy vấn người dùng", group: "Actions", icon: UserCog, color: ACTION },
  { type: "notification", label: "Thông báo", description: "Gửi thông báo hệ thống đến người dùng", group: "Actions", icon: Bell, color: ACTION },
  { type: "toast_notification", label: "Thông báo nổi", description: "Hiển thị thông báo nổi (toast) trên giao diện", group: "Actions", icon: BellRing, color: ACTION },
  { type: "dock_message", label: "Dock tiến trình", description: "Hiển thị / cập nhật trạng thái tiến trình trên dock", group: "Actions", icon: PanelBottom, color: ACTION },
  { type: "delay", label: "Trì hoãn", description: "Chờ trong một khoảng thời gian", group: "Actions", icon: AlarmClock, color: ACTION },
  { type: "log", label: "Nhật ký", description: "Ghi vào nhật ký", group: "Actions", icon: NotebookPen, color: ACTION },
]

/** Service actions for integration nodes (shown as a select in the node form). */
export const INTEGRATION_ACTIONS: Record<string, [string, string][]> = {
  google_sheet: [["read_rows", "Đọc dòng"], ["append_row", "Thêm dòng"], ["update_row", "Cập nhật dòng"], ["clear_range", "Xoá vùng"]],
  google_calendar: [["list_events", "Danh sách sự kiện"], ["create_event", "Tạo sự kiện"], ["update_event", "Sửa sự kiện"], ["delete_event", "Xoá sự kiện"]],
  google_drive: [["list_files", "Danh sách tệp"], ["upload_file", "Tải tệp lên"], ["create_folder", "Tạo thư mục"], ["share_file", "Chia sẻ tệp"]],
  google_tasks: [["list_tasks", "Danh sách việc"], ["create_task", "Tạo việc"], ["complete_task", "Đánh dấu xong"]],
  google_gmail: [["send", "Gửi email"], ["list", "Danh sách email"], ["get", "Xem email"], ["trash", "Chuyển vào thùng rác"], ["untrash", "Khôi phục"]],
  google_photos: [["list_albums", "Danh sách album"], ["upload_from_url", "Tải ảnh lên từ URL"]],
  google_contacts: [["search", "Tìm liên hệ"], ["create", "Tạo liên hệ"], ["update", "Sửa liên hệ"]],
  facebook_page: [["get_page_info", "Thông tin Page"], ["list_posts", "Danh sách bài viết"], ["create_post", "Đăng bài"], ["reply_comment", "Trả lời bình luận"]],
  facebook_ads: [["get_ad_accounts", "Tài khoản quảng cáo"], ["list_campaigns", "Danh sách chiến dịch"], ["get_insights", "Số liệu hiệu quả"]],
  facebook_messaging: [["send_text", "Gửi tin nhắn"], ["send_media", "Gửi media từ URL"], ["get_conversations", "Danh sách hội thoại"]],
  facebook_chat: [["reply", "Trả lời"], ["assign", "Giao người phụ trách"], ["close", "Đóng hội thoại"]],
  zalo_chat: [["reply", "Trả lời"], ["assign", "Giao người phụ trách"], ["close", "Đóng hội thoại"]],
  instagram_chat: [["reply", "Trả lời"], ["assign", "Giao người phụ trách"], ["close", "Đóng hội thoại"]],
  whatsapp_chat: [["reply", "Trả lời"], ["send_template", "Gửi template"], ["close", "Đóng hội thoại"]],
}

export const nodeType = (t: string) => NODE_TYPES.find((n) => n.type === t) ?? { type: t, label: t, description: "", group: "Actions" as const, icon: Braces, color: "#64748b" }

export const TRIGGERS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  ACTIVE_TABLE: { label: "Active Table", icon: Table2, color: "#7c3aed" },
  SCHEDULE: { label: "Schedule", icon: AlarmClock, color: "#ea580c" },
  WEBHOOK: { label: "Webhook", icon: Webhook, color: "#2563eb" },
  FORM: { label: "Form", icon: FileInput, color: "#16a34a" },
}
