# Ghi chú tính năng tham khảo (beqeek.com)

Nguồn: đọc (chỉ đọc) cấu trúc route, menu và nhãn giao diện trong bundle web công khai, cùng các API `/get/` của workspace tham khảo — 2026-10-08.
Đây là bản tóm tắt chức năng để định hướng xây dựng, **không** phải mã hay nội dung sao chép.

Trạng thái trong Tago: ✅ đã có · 🟡 một phần · ⬜ chưa làm (đang là trang "Coming soon")

## 1. Cấu trúc menu (sidebar)

```
Bảng điều khiển                 → danh sách workspace / trang chủ
Thông báo (badge số chưa đọc)
Lời mời (chỉ hiện khi có lời mời đang chờ)
── Tính năng Workspace ──
   Apps  (mở rộng được)
     └─ <Nhóm công việc>  (mở rộng được)
          └─ <Bảng>  → /tables/:id/records   (icon + màu riêng của bảng)
   Cloud Logic (Workflow)
   Biểu mẫu
   Kết nối
   Phân tích
── Social ── (chỉ hiện khi workspace bật tính năng social)
   Facebook Page Inbox · Instagram Inbox · WhatsApp Inbox · Zalo OA Inbox
── Hệ thống ──
   Cài đặt (workspace; chỉ người có quyền)  ·  Trợ giúp & Hỗ trợ
```

- Từng mục trong "Tính năng Workspace" bật/tắt theo cấu hình hệ thống của workspace.
- Cây Apps chỉ hiện các bảng mà người dùng có quyền `access`.
- Có ô tìm nhanh bảng ngay trên sidebar.
- Route khác không nằm trên menu: Tìm kiếm, Hồ sơ, Đội nhóm, Vai trò, Đã gắn sao, Hoạt động gần đây, Lưu trữ.

Tago: ✅ đã dựng lại đúng cấu trúc menu trên (`apps/admin/src/config/navigation.ts`), cây Apps lấy dữ liệu thật từ feature `tables`. ⬜ Lời mời, ẩn/hiện theo quyền & cấu hình.

Rà soát giao diện sidebar (2026-10-09), Tago ✅:
- Đầu sidebar cao 48px, viền dưới: chọn workspace (logo chữ tắt 24px + tên + mũi tên xuống, menu liệt kê workspace có dấu ✓).
- Ô "Tìm kiếm trong không gian làm việc..." có phím tắt `/`, gợi ý bảng (icon màu + tên + nhóm), ↑/↓/Enter/Esc.
- Dòng menu cao 32px, chữ 14px đậm vừa, icon nét mảnh; mục đang mở nền xanh nhạt + chữ xanh.
- Tiêu đề nhóm menu cỡ 12px, mũi tên bên trái, bấm để gập.
- Cây Apps: thụt lề 16px (nhóm, icon thư mục) / 32px (bảng, icon màu riêng); nút gập hiện khi rê chuột; trạng thái gập được lưu.
- Rộng mặc định 256px, kéo 180–480px, thu gọn 64px (chỉ còn icon). "Phân tích" bị ẩn bên tham khảo nên cũng bỏ khỏi menu.
- Thanh trên cùng chung (cao 48px, viền dưới, nền trắng): nút thu gọn/mở sidebar (⌘B; trên mobile mở sheet) bên trái; nút sáng/tối + avatar (menu tài khoản) bên phải. Vùng nội dung nền trắng như bản tham khảo.

## 2. Apps / Bảng dữ liệu (Active Tables) — module lõi

### 2.1 Bảng
| Tính năng | Tago |
|---|---|
| Danh sách bảng theo nhóm công việc, tạo nhóm | ✅ |
| Tạo bảng từ mẫu (trống, pipeline khách hàng, công việc Eisenhower, …) | ✅ (4 mẫu) |
| Tên, mô tả, icon + màu, nhóm | ✅ (icon theo mẫu) |
| Giới hạn số bản ghi / bảng | ⬜ |
| Mã hoá đầu-cuối (E2EE) với khoá phía người dùng; trường được băm để vẫn tìm kiếm được | ⬜ |
| Trường tìm kiếm được; trường hiển thị chính/phụ khi tra cứu bản ghi | 🟡 (tìm trên mọi trường) |
| Màn hình mặc định (danh sách hoặc 1 kanban), hướng sắp xếp mặc định | 🟡 (có sort, chưa chọn màn mặc định trong UI) |
| Sao chép mã bảng, vùng nguy hiểm (xoá bảng) | 🟡 (có xoá) |

### 2.2 Loại trường
Có ở Tago ✅ (đủ 30 loại, đúng thứ tự / nhãn / mô tả / nhóm "Các trường …" như picker của bản tham khảo): văn bản ngắn, **văn bản dài** (`TEXT`, `TEXTAREA` = bí danh cũ), **văn bản có định dạng** (`RICH_TEXT`, trình soạn B/I/U/danh sách/liên kết, lưu HTML đã lọc), điện thoại, email, URL, mã tự sinh (mẫu `{{auto.increment.padLeft(n,0)}}`, `{{date.*}}`), **tệp đính kèm** (`ATTACHMENT`, lưu giả lập trong IndexedDB: tên/kích thước/data URL, tối đa 5 MB mỗi tệp, cho phép nhiều tệp, lọc loại tệp, tải xuống/gỡ), ngày, ngày giờ, **giờ** (`TIME`, HH:mm), **năm / tháng / ngày trong tháng / giờ / phút / giây** (`YEAR`…`SECOND`, số nguyên có khoảng hợp lệ), **số nguyên** (`INTEGER`), số thập phân (`NUMERIC`), **số tự tính** (`NUMERIC_SUMMARY`: công thức trên các trường của bản ghi, hỗ trợ `+ - * /`, so sánh, `&& || !`, `IF(đk, a, b)`; chỉ đọc trong form, tính lại và lưu khi tạo/sửa bản ghi và khi đổi cấu hình bảng; có min/max/đơn vị/thập phân, dùng được trong Tổng hợp/Gantt/Pivot/Objective), có/không, **một ô chọn** (`CHECKBOX_ONE`, tối đa một ô trong danh sách tuỳ chọn), **nhiều ô chọn** (`CHECKBOX_LIST`), chọn một, chọn nhiều, tham chiếu một bản ghi, **tham chiếu nhiều bản ghi** (`SELECT_LIST_RECORD`, chip + bộ chọn bản ghi, dùng được làm liên kết cho tab bản ghi liên quan), **bản ghi tham chiếu đầu tiên** (`FIRST_REFERENCE_RECORD`: chỉ đọc, tính khi đọc = bản ghi tạo sớm nhất trong bảng nguồn có trường tham chiếu trỏ về bản ghi hiện tại), một/nhiều thành viên.

Dữ liệu cũ: store `tago-tables-db` lên v6, trường `RICH_TEXT` cũ (vốn là "văn bản dài") được chuyển sang `TEXT`; giá trị văn bản thường trong trường định dạng vẫn hiển thị đúng.

Thuộc tính trường: bắt buộc ✅, không trùng ✅, placeholder ✅, giá trị mặc định 🟡 (giá trị tĩnh; chưa hỗ trợ biến thời gian TODAY/CURRENT…), giới hạn ký tự ✅, min/max/thập phân/đơn vị ✅, khoá trường ✅, độ rộng cột ✅, tự điền từ bản ghi liên kết ("Tự động điền từ liên kết") ⬜, ràng buộc thời gian (không cho quá khứ/tương lai, min/max) ⬜, điều kiện lọc khi chọn bản ghi tham chiếu ⬜, "bản ghi tham chiếu đầu tiên" với trường liên kết nằm trong dòng chi tiết ⬜.

### 2.3 Màn hình xem bản ghi
| Tính năng | Tago |
|---|---|
| Danh sách dạng bảng: chọn cột, thứ tự cột | ✅ |
| Dòng tổng hợp (COUNT/SUM…), công thức có điều kiện `IF(...)` | 🟡 (COUNT/SUM/AVG/MIN/MAX, chưa có IF) |
| Kanban nhiều màn hình, nhóm theo trường chọn/người dùng, kéo thả | ✅ |
| Bộ lọc nhanh, lọc theo ngày tạo | 🟡 (chưa lọc ngày tạo) |
| Gantt chart (cấu hình trường bắt đầu/kết thúc) | ✅ (Tuần/Tháng/Quý/Năm, Hôm nay, cột Tên/Thời lượng, tiến độ) |
| Pivot / Matrix (dòng × cột thời gian theo ngày/tuần/tháng/quý/năm, measures, tổng dòng/cột) | ✅ |
| Chuyển đổi (conversion view) | ✅ (cột Chính + bảng đích, đồng bộ bộ lọc nhanh, tỷ lệ) |
| Thẻ mục tiêu (objective cards) | ✅ (mục liên quan tải khi mở, tiến độ, current/target) |
| Xuất dữ liệu | ✅ (CSV phía client) |
| Xoá hàng loạt, hành động hàng loạt | 🟡 (chỉ xoá) |

### 2.4 Chi tiết bản ghi
| Tính năng | Tago |
|---|---|
| Bố cục tiêu đề + dòng phụ + danh sách trường | ✅ |
| Bản ghi liên quan từ bảng khác, có nút tạo nhanh | ✅ |
| Bình luận (thêm/sửa/xoá), vị trí panel | ✅ |
| Danh sách chi tiết (item fields — dòng hàng trong đơn) + tổng hợp item, tự khởi tạo item từ bảng kích hoạt | ✅ (ánh xạ trường item + trường tổng; tổng được ánh xạ chép nguyên từ nguồn) |
| Lịch sử thay đổi từng trường (historicalUpdatedAt) | 🟡 (lưu thời điểm đổi gần nhất) |
| Người liên quan / người được giao (tự suy từ trường người dùng) | ✅ (cờ trên trường người dùng → `relatedUserIds`/`assignedUserIds`, bộ lọc “Được giao cho tôi / Liên quan đến tôi”) |
| Trang tạo/sửa bản ghi riêng (route `/records/new`, `/edit`) | 🟡 (dùng dialog) |

### 2.5 Hành động & phân quyền bảng
- Hành động hệ thống: tạo, truy cập, cập nhật, xoá bản ghi; thêm/truy cập/sửa/xoá bình luận. ⬜
- Hành động tuỳ chỉnh (gắn với workflow, có trường nhập) + chạy hàng loạt. ⬜
- Ma trận phân quyền theo Đội nhóm × Vai trò cho từng hành động. ⬜

## 3. Cloud Logic (Workflow) ⬜
- Danh sách "unit" workflow; mỗi unit có nhiều **sự kiện** (bật/tạm dừng), mỗi sự kiện có cấu hình **kích hoạt** (trigger).
- Trình dựng workflow dạng canvas, các node: lấy danh sách/lấy một/tạo/sửa/xoá bản ghi, biến định nghĩa, vòng lặp, điều kiện…
- Console xem log chạy của sự kiện.
- Dock tiến trình hiển thị workflow đang chạy.

## 4. Biểu mẫu (Workflow Forms) ⬜
- Tạo form từ mẫu; trình dựng form: danh sách field (text, textarea, số, email, ngày, ngày giờ, select, checkbox), nhãn, tên biến tự sinh, placeholder, giá trị mặc định, bắt buộc, tuỳ chọn; text nút gửi.
- Form gửi dữ liệu vào workflow / bảng.

## 5. Kết nối (Workflow Connectors) ⬜
- Danh sách connector với thống kê (tổng, đã kết nối, OAuth) và lọc theo loại/trạng thái.
- Chọn loại connector → tạo (tên, mô tả) → cấu hình kỹ thuật / OAuth → trạng thái: hoạt động, chưa kết nối, lỗi, cần kết nối lại.
- Trang chi tiết có tài liệu hướng dẫn, sao chép ID.

## 6. Phân tích ⬜
- Trang phân tích của workspace (hiện bên tham khảo còn là trang placeholder).

## 7. Social Inbox ⬜
- Hộp thư hợp nhất cho Facebook Page, Instagram, WhatsApp, Zalo OA; gắn hội thoại với bản ghi; workflow có thể gửi tin.

## 8. Hệ thống ⬜
- **Cài đặt workspace**: thông tin chung, thành viên (mời / tạo tài khoản, gán đội & vai trò), đội nhóm, vai trò, nhãn (nhóm / vai trò / thông báo), phân quyền.
- **Hồ sơ người dùng**: thông tin cá nhân, ảnh đại diện (≤5MB), đổi mật khẩu, ngôn ngữ (vi/en), giao diện sáng/tối/hệ thống, phím tắt.
- **Thông báo**: danh sách, số chưa đọc, đánh dấu đã đọc / đọc tất cả.
- **Trợ giúp & Hỗ trợ**.

## 9. Gợi ý thứ tự làm tiếp
1. Hoàn thiện Apps: tham chiếu nhiều bản ghi, tệp đính kèm, số tự tính, item fields, lọc theo ngày tạo, màn hình mặc định.
2. Thông báo + Cài đặt workspace (thành viên, đội, vai trò) → nền cho phân quyền.
3. Phân quyền theo hành động trên bảng.
4. Biểu mẫu → Cloud Logic → Kết nối.
5. Gantt / Pivot, Social Inbox, Phân tích.

## 10. Rà soát Apps/Bảng lần 2 (2026-10-08) — phần còn thiếu ở Tago

Xem trực tiếp (chỉ đọc) các trang danh sách bảng, bản ghi, chi tiết bản ghi và tạo bản ghi.

**Trang danh sách bảng (Apps)**
- ✅3 kiểu hiển thị: Danh sách / Bảng / Lưới (Tago chỉ có lưới).
- ✅Nút làm mới; tab lọc nhóm có số đếm ("Tất cả nhóm 8", "CRM 4").
- ✅Thẻ bảng ghi tên loại mẫu (Customer Pipeline, Standard, Blank…) + số trường; tiêu đề nhóm có "N app".

**Trang bản ghi**
- ✅**Bộ lọc nâng cao**: dialog thêm nhiều điều kiện (trường / toán tử / giá trị), Áp dụng / Xoá bộ lọc.
- ✅Lọc theo **Ngày tạo** (khoảng ngày) và **Người tạo**, luôn có sẵn.
- ✅Bộ lọc nhanh: bên đó mỗi trường là một dropdown "Tất cả <trường>" (kể cả trường tham chiếu, người dùng).
- ✅Menu "⋮" trên từng dòng (thao tác nhanh với bản ghi) và cột "#".
- ✅Tiêu đề cột có icon loại trường.
- ✅Thanh "Tổng hợp" dưới bảng hiển thị theo định dạng `1.000,00`.
- 🟡 "Tải xuống" — Tago xuất CSV phía trình duyệt (bên đó export phía server).
- ✅Kanban: mỗi cột có chấm màu, nút lịch và menu cột; thẻ có menu "⋮".
- ✅Mô tả bảng hiện dưới tiêu đề trang.

**Chi tiết bản ghi**
- ✅Header: tiêu đề + dòng phụ ngay trên thanh trên cùng, nút bật/tắt bình luận, menu "Record actions" (⋮).
- ✅Breadcrumb `Apps › <Bảng>`.
- ✅**Tab theo bản ghi liên quan** ("Chi tiết", "Xuất kho", "Công nợ"…) thay vì xếp chồng.
- ✅**Sửa trực tiếp tại chỗ** (vd gỡ/thêm người phụ trách bằng × / +) thay vì mở dialog.
- ✅Danh sách chi tiết: có cột "#", dòng "Tổng cộng: N dòng", khối tổng nằm riêng bên dưới.

**Tạo bản ghi**
- ✅Trang riêng `/records/new` (và `/records/:id/edit`) thay cho dialog; danh sách chi tiết có sẵn 1 dòng trống.

## 11. Rà soát giao diện Apps/Bảng lần 3 (2026-10-09)

Đã chỉnh Tago cho khớp kích thước/bố cục bản tham khảo:
- Bảng màu trung tính (foreground, muted, border, input) và bo góc 0.5rem theo bản tham khảo.
- Trang Apps: padding 24px, nút h-7/h-8, tab nhóm + 3 kiểu xem; kiểu "Danh sách" dạng hàng (Tên / Số trường / Người tạo), kiểu "Bảng" có sắp xếp theo tên/số trường, cột Nhóm dạng nhãn viền; icon bảng trên nền xám.
- Trang bản ghi: header (icon + tiêu đề 24px + mô tả 13px), tab theo loại màn hình (Danh sách / Kanban / Gantt / …) kèm ô chọn màn hình; bảng trong khung bo viền, dòng 36px, cột 220/150/200px, cột "⋮" dính phải, nút "↗ Mở" khi rê chuột; thanh Tổng hợp ngay dưới bảng.
- Kanban: cột 280px nền xám, cao theo nội dung; thẻ dạng danh sách nhãn/giá trị (nhãn 88px).
- Chi tiết bản ghi: header dính trên cùng, dòng phụ là văn bản thường, breadcrumb, tab gạch chân, dòng trường 180px + giá trị, khung bình luận 400px bên phải (ô soạn ở trên, danh sách mới nhất ở dưới, thời gian dạng "28 thg 7 lúc 13:04").
- Tạo/sửa bản ghi: form giữa trang rộng 720px dạng thẻ, 2 cột, chân thẻ Hủy / Tạo bản ghi.

## 12. Rà soát Cài đặt bảng lần 4 (2026-10-13)

Đọc (chỉ đọc) 13 tab cài đặt bảng bên tham khảo, so với Tago. Đã bổ sung:
- **Tổng quan**: Khóa mã hóa (chỉ hiển thị, mã hóa phía máy chủ); **Trường có thể tìm kiếm** (chỉ trường văn bản, ô tìm kiếm danh sách chỉ dò các trường này, để trống = mọi trường); **Trường hiển thị chính / phụ khi tìm bản ghi** (dùng trong ô chọn bản ghi tham chiếu và bộ lọc nhanh, phụ hiện dòng nhỏ bên dưới).
- **Danh sách**: Loại bố cục (Bảng chung); **Sắp xếp theo trường** + Tăng/Giảm dần (để trống = theo ngày tạo).
- **Bộ lọc**: thống kê Trường đủ điều kiện / Bộ lọc đang dùng / Có sẵn.
- **Chi tiết**: **Loại bố cục** Một cột / **Hai cột** (cột trái, cột phải); **Vị trí bình luận** Bên phải / Ẩn; **Hồ sơ liên quan (Tabs)** thêm/sửa/xoá/đổi thứ tự tab, chọn bảng + trường liên kết, bố cục Bảng (Cổ điển) / Danh sách thẻ, bật/tắt nút Tạo mới.
- **Nguy hiểm**: khối cảnh báo + danh sách dữ liệu bị xoá và việc cần làm trước khi xoá.

Các module Cloud Logic (bảng node khớp 100%), Biểu mẫu, Kết nối (24 loại), Social, Cài đặt workspace, Hồ sơ, Thông báo: không thấy thiếu chức năng so với bản tham khảo. Trợ giúp / Ghim / Vai trò / Phân tích bên tham khảo vẫn là trang placeholder.

## 13. Đồng bộ giao diện lần 5 (2026-10-13)

So ảnh chụp (1440px, chỉ đọc) và class DOM của bản tham khảo:
- **Icon**: bản tham khảo dùng Hugeicons (stroke-rounded 1.5). Tago bỏ hẳn lucide-react (cả `apps/admin` và `packages/ui`), dùng trực tiếp `@hugeicons/core-free-icons` (MIT) + `<HugeiconsIcon icon={…} />` từ `@hugeicons/react`. `src/components/icons.tsx` giữ các icon theo ngữ cảnh (sidebar, cài đặt bảng, loại bảng, connector) dưới dạng dữ liệu icon. shadcn `iconLibrary` = hugeicons.
- **Icon loại trường** khớp bản tham khảo: văn bản / mã tự sinh = File02, số = Hashtag, ngày = Calendar01, SĐT = SmartPhone01, URL = Link01, chọn = ListView, tham chiếu = GitBranch, người dùng = UserMultiple (Email, Có/Không, chọn nhiều chưa thấy bên đó → chọn icon gần nhất).
- **Sidebar**: thêm mục Social (4 inbox, mỗi kênh `/social-chat/:channel`, badge chưa đọc riêng).
- **Bảng bản ghi**: chip lựa chọn có viền (màu chữ 20%), tham chiếu là chip xám, checkbox đậm hơn; trang chi tiết dùng chip 22px, nút bật/tắt bình luận trên header, bảng mặt hàng chỉ đọc có kẻ dọc + số căn phải, khối tổng dạng nhãn/giá trị.
- **Kết nối**: danh sách dòng + tab Tất cả / Đã kết nối / Chưa kết nối, icon loại dịch vụ trên nền màu, chip trạng thái, "x/y trường".
- **Workflow, Biểu mẫu**: header p-6, ô tìm 32px, nút 28px, dòng 56px, menu ⋮ hiện khi rê chuột.
- **Bảng điều khiển**: thẻ workspace (avatar 44px, nhãn Chủ sở hữu, người tạo, ngày tạo, ghim sao).

## 14. Rà soát toàn bộ trang lần 6 (2026-10-16)

Chụp (chỉ đọc) ~45 màn hình bản tham khảo ở 1440×900 và so từng cặp với Tago qua 4 vòng sửa. Ảnh/HTML tham khảo và ảnh Tago nằm ở `.gstack/reference/` (không đưa lên git).

- **Nền chữ & token toàn cục** (`packages/ui/src/styles/globals.css`, `apps/admin/src/assets/css/index.css`): font Inter Variable; body 14/20, letter-spacing −0.005em, `text-rendering: optimizeLegibility`; thang khoảng cách `--space-*`, thang chữ `--font-heading-h1..h6-*` / `--font-body-*` (giá trị thực tế ở desktop), `--font-weight-*`; màu nhấn `accent-*` (+ `-subtle`), `primary-subtle`, `surface-*`, `border-card*`, `shadow-surface*`, `success/warning/info` (+ `-subtle`), `--destructive` theo bản tham khảo. Màu chủ đạo vẫn là brand Prep blue.
- **Trang mới**: Đội nhóm (`/team`, `/team/:id`), Lời mời, Quên/Đặt lại mật khẩu, 7 trang giữ chỗ (Trợ giúp, Vai trò, Ghim, Hoạt động gần đây, Lưu trữ, Phân tích, Workflows), toast "Bật thông báo đẩy". Chi tiết: `docs/beqeek-remaining-pages.md`.
- **Cài đặt workspace**: 5 tab (Thông tin hệ thống, Nhóm công việc kéo-thả, Nhóm, Quyền — ma trận phân quyền, Nhãn), tab trong URL `?t=`; dùng chung dữ liệu đội nhóm/nhãn với `/team`.
- **Apps**: đủ 30 loại trường như bản tham khảo; Nhập Excel (ghép cột, file mẫu, lịch sử nhập); "Tự động điền từ liên kết"; sắp xếp theo tiêu đề cột; lọc khoảng ngày cho trường ngày.
- **Bỏ theo bản tham khảo**: menu ⋯ trên thẻ bảng (xoá bảng chỉ trong Cài đặt bảng), ô "Được giao cho tôi / Liên quan đến tôi" và nút Mới nhất/Cũ nhất, nút "+" trên cột Kanban, ô tìm trong bộ chọn loại trường, bảng nút zoom hiện sẵn ở trình dựng workflow (zoom bằng Ctrl/⌘ + cuộn).
- **Còn khác (cố ý / dữ liệu)**: dữ liệu mẫu; logo connector là SVG vẽ lại; console sự kiện có thêm nút "Chạy thử" (không có luồng log thật); Social giữ chi tiết hội thoại, nhãn và người phụ trách.
- **Vòng 5 — giao diện phụ** (thêm 44 màn hình tham khảo): hộp thoại "Tạo Module mới" (2 thẻ, chọn loại module tự nạp trường, nhóm "Chưa phân nhóm"); bộ lọc nâng cao (trạng thái trống, Xóa bộ lọc / Áp dụng); popover Ngày tạo 2 khung (mẫu nhanh + Tùy chọn từ/đến, múi giờ); popover Người tạo; chấm màu trong bộ lọc nhanh; menu ⋮ dòng/chi tiết; khung xem nhanh 840px kéo giãn được, nhớ độ rộng; khung bình luận (định dạng, emoji, đính kèm, nhắc tên, menu ⋯, Trả lời); tab bản ghi liên quan có Mở / Tạo mới; popover "Có mặt" liệt kê người có quyền xem; Gantt (Kỳ trước/Kỳ sau, cột theo ngày, tô cuối tuần, nhãn Hôm nay dính); hộp thoại sửa trường, thêm hành động (chọn icon, thêm trường theo loại), thêm bộ lọc nhanh (dialog), thêm Kanban/Gantt/Pivot/Objective/Chuyển đổi; hộp thoại workflow/sự kiện, thanh công cụ node đang chọn, YAML; hộp thoại tạo/sửa connector; Cài đặt social; tab Cài đặt hồ sơ; hộp thoại nhóm công việc/đội nhóm/nhãn, ô chọn quyền.
- **Khung chung**: menu chọn workspace, menu tài khoản (ảnh đại diện mặc định dạng hình người), ô tìm kiếm sidebar (không tô sẵn kết quả đầu, dòng cao hơn), sidebar thu gọn, trạng thái đang mở của mục cha/con trên cây Apps, nút ☰ trên mobile; bảng màu chế độ tối lấy theo bản tham khảo.
- **Mobile (375px)**: trang bản ghi chuyển sang dạng thẻ + nút "Bộ lọc" gộp + thanh Tổng hợp ghim đáy; nút đầu trang xếp thành hàng full-width.
- **Chưa chụp được ở bản tham khảo**: bảng cấu hình node của trình dựng workflow và hộp thoại "Tạo Form" (không mở được trong trình duyệt headless) — giữ theo Tago.

## 15. Bản cập nhật của bản tham khảo (kiểm tra 2026-10-22)

Bản tham khảo đã ra phiên bản mới (bundle `index-zUGStMlC.js`, chuỗi giao diện tăng 3016 → 3082). So chỉ-đọc với bản chụp ngày 16/10; ảnh/HTML mới ở `.gstack/reference/beqeek/pages2/`, danh sách chuỗi thêm/bớt ở `.gstack/reference/beqeek/new/{added,removed}.tsv`.

| Thay đổi bên tham khảo | Tago |
|---|---|
| **Màn Lịch** (Calendar): tab "Lịch" mới trong Cài đặt bảng (giữa Objective Card và Chuyển đổi), "Thêm màn Lịch" với Tên màn*, Mô tả, Trường ngày* (DATE/DATETIME), Thang thời gian mặc định (Tuần/Tháng/Quý/Cả năm), Tiêu đề chính*, Tiêu đề phụ (nhiều trường, theo thứ tự chọn), Trường trạng thái* (SELECT_ONE), Giá trị hoàn thành, Giá trị ngoại trừ (bị ẩn khỏi lịch, người xem bật lại được); màn xem "Lịch" trong trang bản ghi (Hôm nay, Kỳ trước/Kỳ sau, Hiển thị đã hoàn thành / trạng thái ngoại trừ). Cần ≥1 trường ngày + 1 SELECT_ONE. Chưa bảng nào bật nên chưa có ảnh màn xem. | ⬜ |
| Bỏ nút **"Có mặt"** ở chi tiết bản ghi | ⬜ (Tago vẫn còn — cần gỡ, cả ở khung xem nhanh) |
| Thêm thành viên: gõ tên đăng nhập đã có → dòng "Người dùng đã tồn tại - sẽ mời vào workspace" (ẩn mật khẩu/email); tên mới → "Người dùng mới - sẽ tạo tài khoản mới" | 🟡 (đã ẩn trường, thiếu dòng báo) |
| Cảnh báo rời trang khi chưa lưu: "Thay đổi chưa lưu" / "Thay đổi sẽ bị mất. Tiếp tục?" / "Rời không lưu" / "Ở lại trang" | ⬜ |
| Cấu hình node workflow: Google Calendar "Tạo liên kết Google Meet"; Messenger "Gửi tin nhắn với tag"; node Social "Gửi một tin nhắn văn bản vào hội thoại qua connector của kênh"; HTTP "Phương thức", "Điều kiện lỗi", "Nội dung dạng Base64"; Think Agent "Biểu thức dữ liệu đầu vào (.workflowData.chatMessages)"; bình luận "Nhập ID bình luận", "Nội dung bình luận (Tùy chọn)"; chọn người dùng trực tiếp hoặc bằng biểu thức biến | 🟡 (bảng node giống hệt; thiếu các trường cấu hình mới) |
| Route `/search` (trang Tìm kiếm) — hiện vẫn trả 404; bỏ `/keyboard-shortcuts`; thêm `/prototype/calendar` (bản thử) | — (chưa cần làm) |
| Không đổi: Bảng điều khiển, Thông báo, Apps, danh sách bản ghi, bộ lọc nâng cao, 13 tab cài đặt bảng cũ, Cloud Logic, Biểu mẫu, Kết nối, Hồ sơ, Social, Cài đặt workspace | ✅ |
