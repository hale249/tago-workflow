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
Có ở Tago: văn bản ngắn, văn bản dài, email, điện thoại, URL, số, ngày, ngày giờ, có/không, chọn một, chọn nhiều, một/nhiều thành viên, tham chiếu một bản ghi, mã tự sinh (mẫu `{{auto.increment.padLeft(n,0)}}`, `{{date.*}}`).

Chưa có: văn bản định dạng (rich text thật), số nguyên, giờ trong ngày, năm/tháng/ngày/giờ/phút/giây tách riêng, một ô chọn, danh sách ô chọn, **tham chiếu nhiều bản ghi**, **bản ghi tham chiếu đầu tiên** (lookup ngược), **số tự tính** (công thức), **tệp đính kèm**.

Thuộc tính trường: bắt buộc ✅, không trùng ✅, placeholder ✅, giá trị mặc định 🟡, min/max/thập phân/đơn vị ✅, khoá trường ⬜, tự điền từ trường khác ⬜, độ rộng cột ⬜, điều kiện lọc khi chọn bản ghi tham chiếu ⬜.

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
