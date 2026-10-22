# Mã nguồn mở dạng "Active Table" (tự tạo bảng / DB như NocoDB)

Tổng hợp 2026-10-22. "Dạng Active Table" = người dùng tự tạo bảng, định nghĩa trường (kiểu dữ liệu, lựa chọn, tham chiếu…), nhập bản ghi và xem dưới nhiều màn (lưới, kanban, lịch…) ngay trên giao diện — đúng mô hình module **Apps** của Tago / Active Tables của beqeek.

Giấy phép là thông tin quan trọng nhất (2026 có nhiều dự án đổi giấy phép). Số sao GitHub lấy từ các bài viết năm 2026, nên mở repo kiểm tra lại trước khi quyết định. Ô ghi "(cần kiểm tra)" là thông tin chưa xác minh được từ nguồn 2026.

## Bảng so sánh nhanh

| Dự án | Giấy phép (2026) | Được lấy code cho sản phẩm SaaS? | Công nghệ | Cách lưu dữ liệu | Sao GitHub |
|---|---|---|---|---|---|
| **Baserow** | MIT (phần lõi); premium/enterprise riêng | ✅ Có (phần MIT) | Python/Django + Vue/Nuxt | Mỗi bảng người dùng là một bảng PostgreSQL thật | (cần kiểm tra) |
| **NocoBase** | Thông báo đổi AGPL → **Apache-2.0** (26/02/2026); nhưng repo vẫn có `LICENSE.txt` "NocoBase License Agreement" và header từng file ghi "AGPL-3.0 / Commercial" | ⚠️ Kiểm tra giấy phép từng plugin trước khi lấy code | Node.js + React, kiến trúc plugin | Mô hình dữ liệu trên PostgreSQL/MySQL/SQLite, kết nối được DB ngoài | (cần kiểm tra) |
| **Grist** (grist-core) | Apache-2.0 (bản Community); tính năng enterprise độc quyền | ✅ Có (phần Apache) | TypeScript + Python (công thức) | Mỗi tài liệu là một file SQLite | (cần kiểm tra) |
| **Saltcorn** | MIT | ✅ Có | Node.js | PostgreSQL hoặc SQLite | (cần kiểm tra) |
| **Teable** | AGPL-3.0 (các package trong `packages/` là MIT) | ⚠️ Được, nhưng sửa code mà cung cấp dạng dịch vụ thì phải công khai phần sửa | TypeScript, Next.js, PostgreSQL | Bảng PostgreSQL thật → truy vấn SQL/BI trực tiếp | ~21.9k |
| **APITable** (AITable) | AGPL-3.0 | ⚠️ Như trên | Java/Spring + NestJS + React, MySQL/Redis/RabbitMQ | Bản ghi là JSON (`datasheet_record.data`), cấu hình bảng là một JSON (`datasheet_meta`) | ~15.4k |
| **Mathesar** | GPL-3.0 (không có bản SaaS) | ⚠️ GPL: phân phối bản sửa phải kèm mã nguồn | Python/Django + Svelte | Giao diện trực tiếp trên PostgreSQL có sẵn, dùng phân quyền gốc của Postgres | (cần kiểm tra) |
| **Budibase** | GPL-3.0 | ⚠️ Như trên | Node.js + Svelte | Có DB nội bộ (CouchDB) + kết nối DB ngoài | ~28.3k |
| **undb** | (cần kiểm tra) | (cần kiểm tra) | TypeScript | Local-first, chạy offline | ~3k |
| **NocoDB** | ❌ **Sustainable Use License** từ 09/01/2026 (v0.301.0), không còn là OSI open source | ❌ Không — chỉ dùng nội bộ; cung cấp dịch vụ cho bên thứ ba cần giấy phép thương mại | Node.js + Vue | Lớp giao diện trên DB SQL (PostgreSQL/MySQL/SQLite), biến DB có sẵn thành bảng tính | ~64.5k |

## Chi tiết từng dự án

### Baserow — gần Tago nhất về module Apps, giấy phép thoáng
- Database no-code + automation + application builder + dashboard, có trợ lý AI "Kuma" (tạo bảng, trường, automation bằng ngôn ngữ tự nhiên); trường AI gọi được Ollama nội bộ.
- Hỗ trợ plugin cả frontend và backend; có chứng nhận GDPR, HIPAA, SOC 2 Type II (bản cloud).
- Cuối 2025 chuyển repo từ GitLab sang GitHub (`baserow/baserow`).
- Tham khảo cho Tago: mô hình trường/màn xem, cơ chế plugin trường, automation gắn với bảng.

### NocoBase — no-code dựa trên plugin, có workflow + AI
- Bản 2.0 phát hành 15/02/2026, định hướng AI: "AI Employees" làm việc trên hạ tầng no-code có sẵn, gán được "kỹ năng" từ plugin, trích dẫn kho tri thức, truy vấn dữ liệu lớn.
- Thông báo chuyển sang Apache-2.0 và mở mã các plugin thương mại từ 26/02/2026, **nhưng** khi đọc mã nguồn (22/10/2026) repo vẫn có `LICENSE.txt` ("NocoBase License Agreement") và header từng file vẫn ghi "dual-licensed AGPL-3.0 / Commercial" → phải kiểm tra giấy phép từng plugin trước khi tái sử dụng.
- Tham khảo cho Tago: kiến trúc plugin, mô hình phân quyền, workflow gắn sự kiện dữ liệu (tương ứng Cloud Logic).

### Grist — bảng tính quan hệ
- Kết hợp bảng tính và database: công thức Python, quyền theo dòng/cột/bảng, REST API, webhook, SSO OIDC/SAML, SCIM, widget tuỳ chỉnh, nhập dữ liệu tăng dần, bình luận theo ô.
- Chạy bằng Docker, ứng dụng desktop hoặc ngay trong trình duyệt.
- Tham khảo cho Tago: trường công thức ("Số tự tính"), phân quyền theo dòng/cột.

### Saltcorn — no-code dựng ứng dụng quanh dữ liệu
- Định nghĩa bảng, tạo view, sắp layout, thêm action mà không cần viết code; ra cả web lẫn mobile; MIT (được fork, đóng mã, bán).
- Tham khảo cho Tago: trình dựng view/layout cho trang chi tiết bản ghi.

### Teable — "Postgres no-code" thế hệ mới
- Giao diện bảng tính, cộng tác thời gian thực, tính năng app no-code; dữ liệu nằm trong bảng Postgres chuẩn (không định dạng nội bộ khó đọc) nên trỏ thẳng công cụ BI/báo cáo vào được.
- Dự án mới tăng sao nhanh nhất trong nhóm thay thế Airtable.

### APITable (AITable)
- "Nền tảng low-code hướng API" để dựng ứng dụng cộng tác; có MCP server (`aitable-mcp-server`, cập nhật 07/2025).

### Mathesar
- Giao diện kiểu bảng tính để xem/sửa/truy vấn **trực tiếp** một PostgreSQL có sẵn, dùng phân quyền gốc của Postgres.
- Bản 0.11.0 (05/2026) đã ổn định cho production; 4 bản phát hành nửa đầu 2026; do tổ chức phi lợi nhuận Mathesar Foundation phát triển, có tài trợ 3 triệu USD.

### Budibase
- Ứng dụng nội bộ + automation + AI agent, có DB nội bộ; triển khai cần 6+ service (apps, worker, CouchDB, MinIO, Redis, proxy).

### undb
- Database no-code chạy local-first/offline, tạo API có kiểu (type-safe) và ứng dụng nhanh; dự án nhỏ.

### NocoDB
- Phổ biến nhất (~64.5k sao): biến DB SQL có sẵn thành giao diện bảng tính, REST API, Swagger.
- **Từ v0.301.0 (09/01/2026) đổi AGPL-3.0 → Sustainable Use License (fair-code)**: chỉ dùng cho mục đích nội bộ doanh nghiệp, cá nhân hoặc phi thương mại; cung cấp NocoDB như dịch vụ cho bên thứ ba cần giấy phép thương mại. Chỉ nên tham khảo ý tưởng, không lấy code.

## Gợi ý cho Tago

- **Lấy code / học sâu được (MIT, Apache)**: Baserow (phần lõi, trừ `premium/` và `enterprise/`), Grist, Saltcorn; NocoBase sau khi kiểm tra giấy phép từng plugin.
- **Tham khảo, cẩn thận khi tái sử dụng (AGPL/GPL)**: Teable, APITable, Mathesar, Budibase — nếu sửa code và chạy như dịch vụ (AGPL) hoặc phân phối (GPL) thì phải công khai mã phần sửa.
- **Chỉ tham khảo ý tưởng**: NocoDB (Sustainable Use License).
- Phân tích thiết kế chi tiết (đọc mã nguồn): `docs/opensource-architecture.md`.
- Gần mô hình Active Tables của Tago nhất: **Baserow** (bảng + trường + màn xem + automation), **NocoBase** (thêm workflow, phân quyền, AI), **Teable** (lưu thẳng bảng Postgres — đáng tham khảo khi thiết kế backend cho Tago).

## Nguồn

- NocoDB: [License FAQ (GitHub)](https://github.com/nocodb/nocodb/discussions/6741), [NocoDB License docs](https://nocodb.com/docs/self-hosting/license), [Cloudron: NocoDB is no longer open source](https://forum.cloudron.io/topic/14918/heads-up-nocodb-is-no-longer-open-source.), [Open Source or Source Available in 2026](https://try.direct/blog/open-source-or-source-available-in-2026), [bex.co: NocoDB enterprise gate](https://bex.co/blog/2026/08/17/nocodb-enterprise-gate-open-core-trust-test)
- Baserow: [GitHub](https://github.com/baserow/baserow), [Baserow: Best Airtable alternatives](https://baserow.io/blog/best-airtable-alternatives), [PromptQuorum review](https://www.promptquorum.com/power-local-llm/baserow-review), [OpenApps](https://openapps.pro/apps/baserow)
- NocoBase: [License & pricing 2026-02](https://www.nocobase.com/en/blog/pricing-adjustment-202602), [AGPL → Apache-2.0](https://www.nocobase.com/en/blog/weekly-updates-20260226), [NocoBase 2.0](https://www.nocobase.com/en/blog/nocobase-2-0), [GitHub](https://github.com/nocobase/nocobase)
- Grist: [grist-core GitHub](https://github.com/gristlabs/grist-core), [Self-hosted Grist](https://support.getgrist.com/self-managed/), [dev.co: grist-core](https://dev.co/databases/open-source/grist-core)
- Saltcorn: [saltcorn.com](https://saltcorn.com/), [ideaproof: Saltcorn 2026](https://ideaproof.io/open-source/project/saltcorn), [LinuxLinks](https://www.linuxlinks.com/saltcorn-no-code-application-development-platform/)
- Teable: [opensource.builders](https://opensource.builders/os-alternatives/teable), [OpenAlternative](https://openalternative.co/teable), [OSSAlt 2026](https://ossalt.com/guides/best-open-source-alternatives-to-airtable-2026)
- APITable: [GitHub](https://github.com/apitable/apitable), [star-history](https://www.star-history.com/apitable/apitable/)
- Mathesar: [GitHub](https://github.com/mathesar-foundation/mathesar), [talos.tools](https://talos.tools/selfhosted/mathesar), [LinuxLinks](https://www.linuxlinks.com/mathesar-spreadsheet-tool-postgres-data/)
- Budibase, undb, tổng hợp: [GitHub topic no-code-database](https://github.com/topics/no-code-database), [NocoBase: Top 7 OSS Airtable alternatives](https://www.nocobase.com/en/blog/open-source-airtable-alternatives), [Appsmith vs Budibase vs ToolJet 2026](https://blog.tooljet.com/appsmith-vs-budibase-vs-tooljet/), [Pistack 2026](https://www.pistack.xyz/posts/budibase-vs-appsmith-vs-tooljet-self-hosted-low-code-guide-2026/)
