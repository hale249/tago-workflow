import { type IconSvgElement } from "@hugeicons/react"
import { BrainIcon, BubbleChatIcon, CalculatorIcon, Calendar01Icon, CancelCircleIcon, CheckmarkSquare01Icon, CodeIcon, ContactIcon, DatabaseIcon, Facebook01Icon, File02Icon, FileImportIcon, FileUploadIcon, GitBranchIcon, GitMergeIcon, GlobeIcon, HardDriveIcon, Image01Icon, ImageAdd01Icon, InstagramIcon, Mail01Icon, Megaphone01Icon, Message01Icon, MessageAdd01Icon, Notification01Icon, NotificationBubbleIcon, PencilIcon, RedoIcon, RepeatIcon, Search01Icon, SheetIcon, Shield01Icon, SidebarBottomIcon, SmartPhone01Icon, TableIcon, Timer01Icon, UserIcon, VariableIcon, WebhookIcon } from "@hugeicons/core-free-icons"

export type NodeGroup = "Logic" | "Actions"
export type NodeOutput = { key: string; label: string }
export type NodeType = { type: string; label: string; description: string; group: NodeGroup; icon: IconSvgElement; color: string; outputs?: NodeOutput[] }

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
  { type: "condition", label: "Điều kiện", description: "Phân nhánh if/then/else", group: "Logic", icon: GitBranchIcon, color: LOGIC, outputs: [{ key: "true", label: "Đúng" }, { key: "false", label: "Sai" }] },
  { type: "loop", label: "Vòng lặp", description: "Lặp qua một tập hợp", group: "Logic", icon: RepeatIcon, color: LOGIC },
  { type: "math", label: "Toán học", description: "Thực hiện phép tính toán học", group: "Logic", icon: CalculatorIcon, color: LOGIC },
  { type: "definition", label: "Biến số", description: "Định nghĩa biến", group: "Logic", icon: VariableIcon, color: LOGIC },
  { type: "object_lookup", label: "Tra cứu Đối tượng", description: "Lấy giá trị từ đối tượng theo key", group: "Logic", icon: Search01Icon, color: LOGIC },
  { type: "collection_union", label: "Hợp nhất Mảng", description: "Hợp nhất nhiều mảng thành một, loại bỏ trùng lặp theo trường", group: "Logic", icon: GitMergeIcon, color: LOGIC },
  { type: "validation", label: "Xác thực", description: "Kiểm tra tính hợp lệ của dữ liệu trong workflow", group: "Logic", icon: Shield01Icon, color: LOGIC },
  { type: "stop_with_error", label: "Dừng kèm lỗi", description: "Dừng workflow và trả về lỗi có cấu trúc", group: "Logic", icon: CancelCircleIcon, color: LOGIC },
  { type: "state_init", label: "Khởi tạo state", description: "Khởi tạo biến trạng thái có thể cập nhật nhiều lần", group: "Logic", icon: DatabaseIcon, color: LOGIC },
  { type: "state_update", label: "Cập nhật state", description: "Cập nhật biến trạng thái đã khởi tạo", group: "Logic", icon: PencilIcon, color: LOGIC },
  { type: "loop_control", label: "Điều khiển vòng lặp", description: "Dừng vòng lặp (break) hoặc bỏ qua lượt hiện tại (continue)", group: "Logic", icon: RedoIcon, color: LOGIC },
  // Actions
  { type: "table_operation", label: "Thao tác Bảng", description: "Thao tác CRUD trên Active Tables", group: "Actions", icon: DatabaseIcon, color: ACTION },
  { type: "active_table_html_upload", label: "Tải lên file nội dung", description: "Tải lên file nội dung (HTML/PDF) vào bình luận hoặc field đính kèm", group: "Actions", icon: FileUploadIcon, color: ACTION },
  { type: "table_comment_create", label: "Tạo Bình luận", description: "Tạo bình luận trên bản ghi", group: "Actions", icon: MessageAdd01Icon, color: ACTION },
  { type: "table_comment_get_one", label: "Lấy Bình luận", description: "Lấy một bình luận từ bản ghi", group: "Actions", icon: Message01Icon, color: ACTION },
  { type: "smtp_email", label: "Gửi Email", description: "Gửi email qua SMTP", group: "Actions", icon: Mail01Icon, color: ACTION, outputs: [{ key: "on_open", label: "Đã mở" }, { key: "on_click", label: "Đã click" }, { key: "no_open", label: "Không mở" }, { key: "no_click", label: "Không click" }] },
  { type: "google_sheet", label: "Google Sheet", description: "Đọc/ghi Google Sheets", group: "Actions", icon: SheetIcon, color: ACTION },
  { type: "google_calendar", label: "Google Calendar", description: "Quản lý sự kiện Google Calendar", group: "Actions", icon: Calendar01Icon, color: ACTION },
  { type: "google_drive", label: "Google Drive", description: "Quản lý tệp và thư mục Google Drive", group: "Actions", icon: HardDriveIcon, color: ACTION },
  { type: "google_task", label: "Google Tasks", description: "Quản lý công việc Google Tasks", group: "Actions", icon: CheckmarkSquare01Icon, color: ACTION },
  { type: "google_gmail", label: "Google Gmail", description: "Gửi, đọc và quản lý email Gmail", group: "Actions", icon: Mail01Icon, color: ACTION },
  { type: "google_photos", label: "Google Photos", description: "Quản lý album và hình ảnh Google Photos", group: "Actions", icon: Image01Icon, color: ACTION },
  { type: "google_contacts", label: "Google Contacts", description: "Quản lý danh bạ Google Contacts", group: "Actions", icon: ContactIcon, color: ACTION },
  { type: "facebook_page", label: "Facebook Page", description: "Quản lý bài viết và bình luận trên Facebook Page", group: "Actions", icon: Facebook01Icon, color: ACTION },
  { type: "facebook_ads", label: "Facebook Ads", description: "Quản lý chiến dịch quảng cáo Facebook Ads", group: "Actions", icon: Megaphone01Icon, color: ACTION },
  { type: "facebook_page_messaging", label: "Facebook Messenger", description: "Gửi tin nhắn và quản lý hội thoại Facebook Messenger", group: "Actions", icon: BubbleChatIcon, color: ACTION },
  { type: "facebook_chat", label: "Hội thoại Facebook Messenger", description: "Quản lý và trả lời hội thoại Facebook Messenger trong Social Chat", group: "Actions", icon: Facebook01Icon, color: ACTION },
  { type: "zalo_chat", label: "Hội thoại Zalo OA", description: "Quản lý và trả lời hội thoại Zalo OA trong Social Chat", group: "Actions", icon: Message01Icon, color: ACTION },
  { type: "instagram_chat", label: "Hội thoại Instagram Direct", description: "Quản lý và trả lời hội thoại Instagram Direct trong Social Chat", group: "Actions", icon: InstagramIcon, color: ACTION },
  { type: "whatsapp_chat", label: "Hội thoại WhatsApp Business", description: "Quản lý và trả lời hội thoại WhatsApp Business trong Social Chat", group: "Actions", icon: SmartPhone01Icon, color: ACTION },
  { type: "think_agent", label: "Think Agent", description: "AI agent suy luận theo các bước và trả về kết quả có cấu trúc", group: "Actions", icon: BrainIcon, color: ACTION },
  { type: "image_generation", label: "Tạo ảnh AI", description: "Tạo ảnh bằng AI qua kết nối AI Provider", group: "Actions", icon: ImageAdd01Icon, color: ACTION },
  { type: "api_call", label: "Gọi API", description: "Thực hiện HTTP API request", group: "Actions", icon: GlobeIcon, color: ACTION },
  { type: "user_operation", label: "Thao tác Người dùng", description: "Truy vấn người dùng", group: "Actions", icon: UserIcon, color: ACTION },
  { type: "notification", label: "Thông báo", description: "Gửi thông báo hệ thống đến người dùng", group: "Actions", icon: Notification01Icon, color: ACTION },
  { type: "toast_notification", label: "Thông báo nổi", description: "Hiển thị thông báo nổi (toast) trên giao diện", group: "Actions", icon: NotificationBubbleIcon, color: ACTION },
  { type: "dock_message", label: "Dock tiến trình", description: "Hiển thị / cập nhật trạng thái tiến trình trên dock", group: "Actions", icon: SidebarBottomIcon, color: ACTION },
  { type: "delay", label: "Trì hoãn", description: "Chờ trong một khoảng thời gian", group: "Actions", icon: Timer01Icon, color: ACTION },
  { type: "log", label: "Nhật ký", description: "Ghi vào nhật ký", group: "Actions", icon: File02Icon, color: ACTION },
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

export const nodeType = (t: string) => NODE_TYPES.find((n) => n.type === t) ?? { type: t, label: t, description: "", group: "Actions" as const, icon: CodeIcon, color: "#64748b" }

/** `chip`: icon tile in the events table; `startLabel`: title on the canvas start node. */
export const TRIGGERS: Record<string, { label: string; startLabel: string; icon: IconSvgElement; color: string; chip: string }> = {
  ACTIVE_TABLE: { label: "Active Table", startLabel: "Sự kiện bảng", icon: TableIcon, color: "#7c3aed", chip: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
  SCHEDULE: { label: "Schedule", startLabel: "Lịch trình", icon: Calendar01Icon, color: "#ea580c", chip: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
  WEBHOOK: { label: "Webhook", startLabel: "Webhook", icon: WebhookIcon, color: "#2563eb", chip: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  FORM: { label: "Form", startLabel: "Biểu mẫu", icon: FileImportIcon, color: "#16a34a", chip: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
}
