import { Analytics01Icon, Archive01Icon, Clock01Icon, GitBranchIcon, HelpCircleIcon, Shield01Icon, StarIcon } from "@hugeicons/core-free-icons"

import { PlaceholderCard } from "../components/placeholder-card"

// One page per not-yet-built route; copy matches beqeek's placeholder pages verbatim.

export function HelpPage() {
  return <PlaceholderCard icon={HelpCircleIcon} title="Trợ giúp & hỗ trợ" description="Xem hướng dẫn, liên hệ hỗ trợ và cập nhật trạng thái. Trung tâm trợ giúp sẽ ra mắt cùng điều hướng mới." />
}

export function RolesPage() {
  return <PlaceholderCard icon={Shield01Icon} title="Vai trò & quyền" description="Định nghĩa quyền chi tiết, tạo vai trò tùy chỉnh và kiểm tra quyền truy cập. Lớp dữ liệu đang được hoàn thiện." />
}

export function StarredPage() {
  return <PlaceholderCard icon={StarIcon} title="Bộ sưu tập được ghim" description="Giữ các bảng, workflow và dashboard quan trọng trong tầm tay. Tính năng ghim sẽ ra mắt cùng sidebar mới." />
}

export function RecentActivityPage() {
  return <PlaceholderCard icon={Clock01Icon} title="Hoạt động gần đây" description="Xem các thay đổi, phê duyệt và nhật ký trong một dòng thời gian. Nguồn sự kiện trực tiếp đang được kết nối." />
}

export function ArchivedPage() {
  return <PlaceholderCard icon={Archive01Icon} title="Mục đã lưu trữ" description="Khôi phục bảng, workflow và form không còn hoạt động. Chính sách lưu trữ và khôi phục đang được triển khai." />
}

export function AnalyticsPage() {
  return <PlaceholderCard icon={Analytics01Icon} title="Phân tích Workspace" description="Theo dõi xu hướng sử dụng, hiệu suất tự động hóa và sức khỏe đội ngũ với bảng điều khiển trực quan. Báo cáo sẽ xuất hiện sớm." />
}

export function WorkflowsPage() {
  return <PlaceholderCard icon={GitBranchIcon} title="Tự động hóa quy trình sắp ra mắt" description="Thiết kế workflow, điều phối tự động hóa và theo dõi tiến độ theo thời gian thực. Tính năng này đang được kết nối với sidebar mới." />
}
