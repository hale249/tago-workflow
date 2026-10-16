# Các trang còn lại cần dựng UI (tham khảo beqeek.com)

Nguồn: đọc chỉ-xem giao diện đang chạy của beqeek.com (đã đăng nhập), bundle route và file chuỗi giao diện — 2026-10-15.
Ảnh chụp 1440×900 + HTML phần `<main>` của từng trang nằm ở `.gstack/reference/beqeek/` (đã gitignore, chỉ có trên máy này).

## 0. Đối chiếu route

| Route beqeek | Tago | Bên beqeek là |
|---|---|---|
| `/workspaces` (Bảng điều khiển Workspace) | ✅ `/` (cần so lại thẻ workspace) | trang thật |
| `/workspaces/:ws/team` | ⬜ | **trang thật** |
| `/workspaces/:ws/team/:teamId` | ⬜ | **trang thật** (tab Thành viên / Vai trò) |
| `/workspaces/:ws/invitations` | ⬜ | **trang thật** |
| `/forgot-password`, `/reset-password` | ⬜ (link "Quên mật khẩu?" đang `#`) | trang thật (lấy từ chuỗi, chưa chụp vì cần đăng xuất) |
| `/help` | ⬜ (đang Coming soon) | trang giữ chỗ |
| `/workspaces/:ws/roles` | ⬜ | trang giữ chỗ |
| `/workspaces/:ws/starred` | ⬜ | trang giữ chỗ |
| `/workspaces/:ws/recent-activity` | ⬜ | trang giữ chỗ |
| `/workspaces/:ws/archived` | ⬜ | trang giữ chỗ |
| `/workspaces/:ws/analytics` | ⬜ | trang giữ chỗ |
| `/workspaces/:ws/workflows` | ⬜ | trang giữ chỗ |
| `/keyboard-shortcuts` | — | 404 bên beqeek, bỏ qua |

Thành phần dùng chung còn thiếu: **toast "Bật thông báo đẩy"** (góc dưới phải, xem §6).

## 1. Quản lý đội nhóm — `/team` (`team.png`)

Khung: `p-[var(--space-300)]` (24px), các khối cách nhau 24px.

- **Header** (`lg:flex-row lg:justify-between`):
  - Trái: H1 "Quản lý đội nhóm" (~24px, đậm) + dòng phụ 12px muted "Workspace • <tên workspace>".
  - Phải: ô tìm `h-10 rounded-lg border-border/60 pl-8`, placeholder "Tìm kiếm đội nhóm...", icon kính lúp bên trái; nút chính `h-7 rounded-md px-2.5 bg-brand-primary` có icon "+", chữ "Tạo đội nhóm mới".
- **Chip thống kê**: `h-[22px] rounded-md border px-1.5 text-xs font-medium`, có icon: "3 đội nhóm" (icon người), "4 vai trò" (icon khiên).
- **Chip đếm danh sách**: chip giống trên nhưng `border-dashed`: "3 đội nhóm".
- **Danh sách**: `divide-y overflow-hidden rounded-lg border bg-card`. Mỗi hàng `role=button`, `group flex min-h-14 items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer`:
  - Ô icon `size-8 rounded-md bg-accent-blue-subtle text-accent-blue` (icon nhóm người).
  - Tên `truncate text-sm font-medium`.
  - Bên phải (`hidden sm:flex gap-3 text-[13px] text-muted-foreground`): "Đội nhóm" · icon khiên + "N vai trò" (`tabular-nums`).
  - Nút ⋮ `h-7 w-7` ghost, chỉ hiện khi rê chuột/focus (`sm:opacity-0 sm:group-hover:opacity-100`). Menu: **Chỉnh sửa · Xem chi tiết · Xóa**.
  - Bấm hàng → `/team/:teamId`.
- Trống: "Chưa có đội nhóm nào" / "Tạo đội nhóm đầu tiên để tổ chức thành viên workspace và phân công vai trò."
- Xóa: hộp xác nhận "Xóa đội nhóm?" với nút "Xóa đội nhóm" (đang xử lý: "Đang xóa...").

### Hộp thoại Tạo / Sửa đội nhóm (`dlg-create-team.png`)
Dialog rộng ~500px, tiêu đề `text-lg font-semibold`, mô tả `text-sm muted`, nút X góc phải trên.
- Tạo: "Tạo đội nhóm mới" / "Tạo đội nhóm mới để tổ chức thành viên workspace". Sửa: "Chỉnh sửa đội nhóm" / "Cập nhật thông tin đội nhóm bên dưới", nút "Cập nhật đội nhóm".
- Trường:
  - **Tên đội nhóm \*** (input `h-8`), placeholder "ví dụ: Kỹ thuật, Marketing". Lỗi: "Tên đội nhóm không được để trống", "Tên đội nhóm không được quá 100 ký tự".
  - **Mô tả (Tùy chọn)** (textarea `min-h-[80px] rows=4`), placeholder "Mô tả mục đích và trách nhiệm của đội". Tối đa 500 ký tự.
  - **Nhãn (Tùy chọn)**: combobox "Chọn nhãn cho nhóm", ô tìm "Tìm nhãn nhóm...", rỗng: "Không có nhãn nhóm".
- Chân: "Hủy" (outline `h-8`) + "Tạo đội nhóm mới" (primary `h-8`), canh phải.

## 2. Chi tiết đội — `/team/:teamId` (`team-members.png`, `team-detail.png`, `team-roles.png`)

- Header: nút quay lại `size-8 -ml-2` (mũi tên trái) + H1 tên đội; dòng phụ 12px "Quản lý đội nhóm và vai trò trong workspace" (thụt theo tiêu đề).
- Tabs `h-10 rounded-md bg-muted p-1`; tab `rounded-sm px-3 py-1.5 text-sm font-medium`, tab đang chọn `bg-primary-subtle text-primary-subtle-foreground` (nền xanh nhạt, chữ xanh). Tab có icon: **Thành viên** (người), **Vai trò** (khiên).

### Tab Thành viên
- Thanh công cụ (`pt-6`, `justify-between`): ô tìm `h-8` "Tìm kiếm thành viên..." (rộng ~256px) + select `h-8 w-[200px]` "Tất cả vai trò"; phải: nút outline `h-7` "+ Thêm thành viên".
- Bảng trong card `rounded-lg border py-5`: header `h-9 text-[13px] font-medium muted`, cột: checkbox (`w-[50px]`) · **Tên** (avatar tròn 32px + tên) · **Tên đăng nhập** (`hidden md:table-cell`) · **Vai trò** (canh phải, chip viền tên vai trò). Hàng `border-b border-border/70 hover:bg-muted/60`, chọn `bg-primary/[0.06]`.
- Chọn nhiều → xóa hàng loạt: "Xóa khỏi vai trò", xác nhận "Xóa thành viên khỏi vai trò?"; nếu đang lọc "Tất cả vai trò": "Vui lòng chọn vai trò để thực hiện xóa hàng loạt".
- Trống (`team-detail.png`): card, ô icon 40px nền muted, "Đội này chưa có thành viên nào" (đậm) / "Thêm thành viên vào đội này để phân công công việc."

### Hộp thoại Thêm thành viên (`dlg-add-member.png`)
"Thêm thành viên" / "Mời người dùng hiện có hoặc tạo tài khoản mới".
- **Tên đăng nhập \*** "Nhập tên đăng nhập" · **Mật khẩu \*** "Nhập mật khẩu cho tài khoản mới" · **Email \*** "user@example.com" (lỗi "Email không hợp lệ") · **Họ tên (Tùy chọn)** "Nguyễn Văn A" · **Đội nhóm \*** (select, khoá sẵn đội hiện tại) · **Vai trò \*** "Chọn vai trò" (lỗi "Vui lòng chọn vai trò").
- Đội chưa có vai trò: "Đội này chưa có vai trò. Tạo vai trò trước khi thêm thành viên."
- Chân: "Hủy" + "Tạo và thêm" (đang xử lý "Đang tạo..."); chế độ mời người có sẵn: "Mời thành viên" / "Đang mời...".

### Tab Vai trò
- Thanh công cụ: combobox `w-[260px]` "Lọc theo nhãn vai trò" (tìm "Tìm nhãn vai trò...", rỗng "Không có nhãn vai trò"); phải: nút outline "+ Tạo vai trò mới".
- Bảng: **Tên vai trò** (đậm; dưới có chip nhãn nếu có, vd "leader") · **Mã** (muted) · **Mô tả** ("—" khi rỗng) · **Hành động** (canh phải: icon bút sửa, icon thùng rác màu đỏ).
- Trống: "Chưa có vai trò nào" / "Tạo vai trò để định nghĩa quyền hạn và trách nhiệm cho thành viên đội."

### Hộp thoại Tạo vai trò (`dlg-create-role.png`)
"Tạo vai trò mới" / "Tạo vai trò mới để gán cho thành viên đội".
- **Tên vai trò \*** "ví dụ: Lập trình viên, Quản lý, Thiết kế" (bắt buộc, ≤100) · **Mô tả (Tùy chọn)** "Mô tả trách nhiệm và quyền hạn của vai trò" (≤500) · **Nhãn (Tùy chọn)** "Chọn nhãn cho vai trò".
- Chân: "Hủy" + "Tạo vai trò".

## 3. Lời mời — `/invitations` (`invitations.png`)

- Sidebar: mục **Lời mời** (icon phong bì) dưới "Thông báo", chỉ hiện khi có lời mời đang chờ hoặc đang ở trang này.
- Link ghost `h-7 px-2` "‹ Quay lại Bảng điều khiển" → `/workspaces`.
- H1 "Lời mời cho <tên workspace>" + mô tả "Xem lại đội nhóm và vai trò trước khi tham gia." (gap 8px; khối cách 40px).
- Card `border-dashed border-border/70 bg-muted/20 rounded-lg py-5`: tiêu đề `text-base font-semibold` có icon phong bì "Lời mời vào workspace"; trống: `text-[13px] muted` "Bạn không có lời mời vào workspace nào đang chờ."
- Khi có lời mời (lấy từ chuỗi): chip "Đang chờ", "Phân công đội nhóm và vai trò" (Đội/Vai trò, mặc định "… chưa xác định"), nút **Chấp nhận** ("Đang chấp nhận...") và **Từ chối** ("Đang từ chối..."); xác nhận "Từ chối lời mời?" với "Giữ lời mời" / "Từ chối lời mời". Toast: "Đã chấp nhận lời mời vào workspace." / "Đã từ chối lời mời vào workspace.". Lỗi tải: "Không thể tải lời mời vào workspace" + "Vui lòng thử lại sau ít phút." + "Thử lại".
- Trên Bảng điều khiển có khối "Đang chờ tham gia" — "Các workspace đã mời bạn và đang chờ phản hồi. Xem lại lời mời để tham gia hoặc từ chối." + nút "Xem lời mời".

## 4. Bảng điều khiển Workspace — so lại với `/` của Tago (`workspaces.png`)

- H1 "Bảng điều khiển Workspace" + "N workspace đang hoạt động"; khối cách 40px.
- Lưới `grid-cols-12 gap-6`, thẻ `md:col-span-6 lg:col-span-4 xl:col-span-3`.
- Thẻ: `rounded-lg border py-5 shadow-surface bg-surface-elevated`, rê chuột `-translate-y-1` + đổ bóng mạnh hơn; nút ⋮ góc trên phải chỉ hiện khi rê chuột.
  - Avatar chữ tắt 44px bo góc, nền gradient (BA: xanh cyan, MA: cam), chữ trắng đậm.
  - Tên `text-base font-semibold`, "@namespace" `text-xs muted`, chip "Chủ sở hữu" (icon khiên, `h-5 text-[11px] bg-muted`) khi là chủ.
  - Dòng `text-xs muted` có icon: người tạo; "Tạo lúc dd/MM/yyyy".
- Tạo workspace: "Tạo Workspace mới" — "Thiết lập tên, namespace và mô tả. Bạn có thể cấu hình đội nhóm, vai trò và Apps sau khi tạo."

## 5. Trang giữ chỗ (`roles.png`, `help.png`)

Bố cục chung: `min-h-[calc(100vh-4rem)] p-6 lg:p-10`; card `mx-auto max-w-3xl border-dashed rounded-lg py-5`, canh giữa: vòng tròn icon 48px `bg-primary/10` (icon màu xanh), tiêu đề ~20px đậm, mô tả `text-sm muted`.

| Route | Tiêu đề | Mô tả |
|---|---|---|
| `/help` | Trợ giúp & hỗ trợ | Xem hướng dẫn, liên hệ hỗ trợ và cập nhật trạng thái. Trung tâm trợ giúp sẽ ra mắt cùng điều hướng mới. |
| `/roles` | Vai trò & quyền | Định nghĩa quyền chi tiết, tạo vai trò tùy chỉnh và kiểm tra quyền truy cập. Lớp dữ liệu đang được hoàn thiện. |
| `/starred` | Bộ sưu tập được ghim | Giữ các bảng, workflow và dashboard quan trọng trong tầm tay. Tính năng ghim sẽ ra mắt cùng sidebar mới. |
| `/recent-activity` | Hoạt động gần đây | Xem các thay đổi, phê duyệt và nhật ký trong một dòng thời gian. Nguồn sự kiện trực tiếp đang được kết nối. |
| `/archived` | Mục đã lưu trữ | Khôi phục bảng, workflow và form không còn hoạt động. Chính sách lưu trữ và khôi phục đang được triển khai. |
| `/analytics` | Phân tích Workspace | Theo dõi xu hướng sử dụng, hiệu suất tự động hóa và sức khỏe đội ngũ với bảng điều khiển trực quan. Báo cáo sẽ xuất hiện sớm. |
| `/workflows` | Tự động hóa quy trình sắp ra mắt | Thiết kế workflow, điều phối tự động hóa và theo dõi tiến độ theo thời gian thực. Tính năng này đang được kết nối với sidebar mới. |

Icon: khiên (roles), dấu hỏi (help); các trang còn lại chọn icon tương ứng (sao, đồng hồ, hộp lưu trữ, biểu đồ, nhánh workflow).

## 6. Toast "Bật thông báo đẩy"

Card nổi góc dưới phải (~360×112, cách mép 16px, `rounded-lg border shadow`): vòng tròn icon chuông nền xanh nhạt; tiêu đề "Bật thông báo đẩy", mô tả `text-xs muted` "Nhận thông báo realtime khi có cập nhật mới"; nút primary nhỏ "Bật" + nút ghost "Để sau"; nút X góc trên phải.

## 7. Quên / đặt lại mật khẩu (chỉ có chuỗi, chưa chụp)

- **Quên mật khẩu** — "Đặt lại mật khẩu" / "Nhập email gắn với tài khoản của bạn. Chúng tôi sẽ gửi liên kết đặt lại mật khẩu."; trường Email ("ban@congty.com"); nút "Gửi liên kết đặt lại" ("Đang gửi..."); thành công: "Hãy kiểm tra email của bạn" / "Nếu tồn tại tài khoản với email này, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu."; link "Quay lại đăng nhập". Lỗi: "Vui lòng nhập email.", "Vui lòng nhập email hợp lệ.", "Không thể gửi yêu cầu. Vui lòng thử lại."
- **Đặt lại mật khẩu** — "Tạo mật khẩu mới" / "Chọn mật khẩu mạnh để bảo vệ tài khoản của bạn."; "Mật khẩu mới" ("Tối thiểu 6 ký tự"), "Xác nhận mật khẩu" ("Nhập lại mật khẩu mới"), nút hiện/ẩn mật khẩu; nút "Cập nhật mật khẩu" ("Đang cập nhật..."). Thông báo: "Đã cập nhật mật khẩu. Bạn có thể đăng nhập bằng mật khẩu mới.", "Mật khẩu phải có ít nhất 6 ký tự.", "Mật khẩu không khớp.", "Liên kết đặt lại không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới."

## 8. API mà các trang trên gọi (đều `POST`, tiền tố `https://api.beqeek.com/api/workspace/{ws}`)

- Đội nhóm: `workspace/get/p/teams`; vai trò: `workspace/get/p/team_roles`; thành viên: `workspace/get/users`
- Nhãn: `label/get/labels`, `label/get/p/labels`
- Lời mời: `me/get/incoming-invitations`, `me/post/incoming-invitations/{id}/{accept|reject}`; ở cấp user: `/api/user/me/get/pending-workspaces`
- Workspace: `/api/user/me/get/workspaces`, `/api/workspace/post/workspaces`
