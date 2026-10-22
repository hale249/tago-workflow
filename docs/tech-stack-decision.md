# Chọn ngôn ngữ backend cho Tago: Go hay Node.js

Ngày: 2026-10-22. Ưu tiên của dự án: **tiết kiệm chi phí** và **bảo mật**.

**Kết luận: chọn Go cho backend**, giữ React + TypeScript cho frontend. Phần lớn số liệu chi phí là benchmark của bên thứ ba (2026), chưa đo trên chính hệ thống Tago; nên chạy thử nghiệm nhỏ (mục 9) trước khi chốt hẳn.

---

## 1. Bối cảnh

Backend Tago cần làm những việc sau (theo các module đã dựng ở frontend và API bản tham khảo, xem `docs/beqeek-api-2026-10-22.md`):

| Phần | Đặc điểm tải |
|---|---|
| Apps (Active Tables): bảng, trường, bản ghi, màn xem, lọc, sắp xếp, nhập Excel | Truy vấn Postgres là chính (JSONB, lọc, phân trang); nhập/xuất file lớn tốn CPU + RAM |
| Cloud Logic (workflow) | Nhiều lượt chạy song song, chờ hẹn giờ, gọi API ngoài (Zalo, Facebook, Google, AI, HTTP) |
| Social Inbox | Webhook vào liên tục từ Facebook/Instagram/WhatsApp/Zalo, gửi tin nhắn ra |
| Realtime | Giữ nhiều kết nối WebSocket, phát sự kiện khi dữ liệu đổi |
| Bảo mật dữ liệu | Giữ token OAuth của Zalo/Facebook/Google, mật khẩu DB, khoá mã hoá bảng (E2EE), phân quyền theo đội/vai trò |

Frontend hiện là monorepo pnpm (React + TypeScript). Một số logic nghiệp vụ đang nằm ở frontend và backend cũng cần: `apps/admin/src/features/tables/types/table.ts`, `utils/fields.ts`, `utils/filters.ts`, `utils/formula.ts`, `features/workflow-units/utils/yaml.ts`.

## 2. Tiêu chí so sánh

1. Chi phí hạ tầng (RAM, CPU, số máy).
2. Bảo mật: rủi ro từ thư viện bên thứ ba, bề mặt tấn công khi triển khai, công cụ quét lỗ hổng.
3. Chi phí phát triển và bảo trì: tốc độ làm, khả năng dùng chung code với frontend, hệ sinh thái tích hợp.
4. Kỹ năng của đội.

## 3. Chi phí hạ tầng

| Chỉ số (benchmark 2026, bên thứ ba) | Go | Node.js |
|---|---|---|
| RAM lúc rảnh, API đơn giản | ~10–15 MB | ~30–50 MB |
| Tài nguyên tính toán cho cùng tải | ít hơn 50–70% | — |
| Thông lượng JSON CRUD | Go 1.23 ~142.000 req/s | Express 5 thấp hơn ~7,4 lần |
| Ví dụ 100 triệu request/tháng trên AWS Lambda | ~167 USD | ~315 USD |
| Số container trên cùng máy | nhiều hơn, tiết kiệm ~33% hạ tầng | — |

Cần hiểu đúng:
- **Postgres, Redis, lưu file tốn như nhau** dù chọn ngôn ngữ nào; với loại sản phẩm này DB thường là khoản lớn nhất. Phần tiết kiệm chủ yếu nằm ở máy chạy API và worker.
- Chỗ Go tiết kiệm rõ nhất: **worker workflow** và **realtime**. Goroutine chỉ tốn vài KB, chạy hàng chục nghìn việc chờ I/O (gọi API ngoài, hẹn giờ, giữ WebSocket) trên một máy nhỏ.
- Chỗ chậm thật sự của Active Tables thường là **câu truy vấn SQL** (lọc trên JSONB, tính lookup). Thiết kế SQL tốt (`docs/opensource-architecture.md` mục 3) quan trọng không kém chọn ngôn ngữ.
- Bài benchmark cũng nhắc: đội làm nhanh hơn 2 lần dù tốn hạ tầng hơn 30% thường vẫn thắng. Nếu đội chưa quen Go, chi phí phát triển có thể lấn át phần tiết kiệm server.

## 4. Bảo mật

### 4.1 Rủi ro thư viện npm (2025–2026)

| Thời điểm | Sự cố | Quy mô |
|---|---|---|
| 11/2025 | **Shai-Hulud 2.0** — worm tự lây, lấy cắp thông tin đăng nhập của lập trình viên, đẩy dữ liệu ra repo GitHub công khai | 796 package, hơn 20 triệu lượt tải/tuần |
| 04–05/2026 | **Mini Shai-Hulud** — vào qua pipeline GitHub Actions của **TanStack**; trong 6 phút phát hành 84 bản độc hại thuộc 42 package `@tanstack/*`; lan cả sang PyPI | 373 phiên bản độc hại / 169 package npm, tổng hơn 518 triệu lượt tải |
| 08/2026 | Đợt lớn nhất — chiếm `keyv`, `cacheable`, `flat-cache`, `file-entry-cache`… | hơn 400 package, hơn 1.300 phiên bản, ~2 tỷ lượt cài/tháng |

Điểm đáng lo:
- Đây là lần đầu worm phát hành package độc hại **có chứng nhận nguồn gốc build SLSA Level 3 hợp lệ** — chứng nhận chỉ xác nhận "pipeline nào build", không chứng minh pipeline sạch.
- Cơ chế lây chủ yếu qua **script chạy khi cài đặt** (`postinstall`) và qua token CI bị lộ.
- **Frontend Tago đang dùng `@tanstack/react-query`** → nên kiểm tra phiên bản trong `pnpm-lock.yaml` có thuộc các bản bị chiếm hay không, bất kể backend chọn gì.
- Ở backend, hậu quả nặng hơn frontend: tiến trình backend giữ mật khẩu DB, token OAuth Zalo/Facebook/Google, khoá mã hoá. Một package độc chạy trong backend có thể lấy toàn bộ.

### 4.2 Vì sao Go ít rủi ro hơn

| Điểm | Go | Node.js |
|---|---|---|
| Số thư viện ngoài | Thư viện chuẩn có sẵn HTTP server, TLS, crypto, JSON, SQL driver interface → thường vài chục module | Thường hàng trăm đến hàng nghìn package (kể cả gián tiếp) |
| Script khi cài đặt | Không có | Có (`preinstall`/`postinstall`) — đường lây chính của Shai-Hulud |
| Sửa lén phiên bản đã phát hành | Checksum database `sum.golang.org` + `go.sum` phát hiện ngay | Phụ thuộc lockfile + integrity hash; không có sổ cái công khai toàn cục |
| Quét lỗ hổng | `govulncheck` (chính thức) chỉ báo lỗ hổng nằm trên đoạn code **thật sự được gọi tới**; CSDL `vuln.go.dev` có người kiểm duyệt → ít báo nhầm | `npm audit` báo theo phiên bản, nhiều cảnh báo không liên quan |
| Đóng gói triển khai | Một file chạy tĩnh, image *distroless* / `scratch` (không shell, không trình quản lý gói) | Cần runtime Node + `node_modules` trong image |

Giới hạn cần biết của Go: checksum database **không chặn được một phiên bản độc hại mới** (chỉ phát hiện phiên bản cũ bị sửa). Vẫn phải khoá phiên bản, review trước khi nâng cấp, và hạn chế số module.

## 5. Chi phí phát triển

| | Go | Node.js / TypeScript |
|---|---|---|
| Dùng chung code với frontend | Không — phải viết lại kiểu trường, bộ lọc, công thức | Có — tách `packages/core` dùng chung |
| Tích hợp ngoài | Google có SDK Go chính thức; Facebook Graph, Zalo OA, WhatsApp Cloud, Instagram là REST thuần → gọi bằng `net/http` | Nhiều SDK và node viết sẵn (kể cả node Zalo cho n8n) |
| Dự án cùng loại | Hiếm (PocketBase) | Teable, APITable, NocoDB, NocoBase đều dùng TS và chia sẻ core FE/BE |
| Bảo trì lâu dài | Ngôn ngữ ít thay đổi, ít phá vỡ khi nâng cấp | Hệ sinh thái thay đổi nhanh, nâng cấp thư viện thường xuyên |
| Kỹ năng đội | Máy dev có cấu hình GoLand → có thể đội đã quen Go | Đội frontend đã quen TypeScript |

## 6. Kết luận và lý do

**Chọn Go cho backend** vì:
1. Tiết kiệm hạ tầng rõ nhất ở đúng những phần nặng của Tago (worker workflow, webhook social, realtime).
2. Giảm mạnh rủi ro chuỗi cung ứng thư viện — quan trọng vì backend giữ token OAuth và khoá mã hoá.
3. Triển khai gọn, image nhỏ, ít lỗ hổng hệ điều hành.

Điều kiện để quyết định này đúng: **đội backend làm được Go**. Nếu đội chủ yếu chỉ biết TypeScript, chọn Node.js kèm toàn bộ biện pháp ở mục 8.2 sẽ an toàn hơn về tiến độ.

## 7. Kiến trúc đề xuất (Go)

| Thành phần | Lựa chọn | Ghi chú |
|---|---|---|
| HTTP API | `net/http` + `go-chi/chi` | Ít phụ thuộc |
| Postgres | `jackc/pgx` + `sqlc` | SQL viết tay, kiểm tra kiểu lúc biên dịch; dịch cây bộ lọc sang SQL trên JSONB |
| Migration | `pressly/goose` hoặc `golang-migrate` | Chạy trong CI/CD, không chạy tự động lúc khởi động production |
| Hàng đợi / worker | Redis (`redis/go-redis`) hoặc NATS JetStream | Worker workflow, nhập Excel, gửi tin social, webhook |
| Realtime | `coder/websocket` + Redis pub/sub | Phát sự kiện **sau khi commit**, kèm id phiên để không gửi lại người vừa sửa |
| Xác thực | JWT ngắn hạn + refresh token; mật khẩu băm `argon2id` (`golang.org/x/crypto`) | Token API riêng cho tích hợp |
| Mã hoá bí mật | AES-GCM (thư viện chuẩn `crypto/aes`, `crypto/cipher`); khoá master từ KMS/Vault | Mã hoá token OAuth và khoá bảng trước khi lưu DB |
| Excel | `xuri/excelize` | Nhập/xuất `.xlsx` |
| Quan sát hệ thống | OpenTelemetry → SigNoz | Đã có SigNoz trong môi trường dev |
| Hợp đồng API | OpenAPI 3.1 là nguồn gốc → sinh client TS cho frontend (`openapi-typescript`) và kiểu Go (`oapi-codegen`) | Chống lệch kiểu giữa hai phía |

Cách bù việc không dùng chung code TypeScript:
1. **Bản đặc tả chung**: JSON Schema / OpenAPI cho kiểu trường, cấu hình bảng (`config.fields`, `kanbanConfigs`, `calendarConfigs`…), cây bộ lọc.
2. **Server là nguồn đúng** cho bộ lọc và công thức "Số tự tính"; frontend chỉ xem trước.
3. **Bộ ca kiểm thử dạng JSON dùng chung** (đầu vào → kết quả mong đợi cho bộ lọc, công thức, chuyển đổi giá trị trường), chạy trong test của cả Go lẫn TS để phát hiện lệch.

## 8. Danh sách việc bảo mật

### 8.1 Backend Go
- CI chạy mỗi lần push và hằng ngày: `govulncheck ./...`, `gosec`, `staticcheck`.
- `GOFLAGS=-mod=readonly`, commit `go.sum`, bật `GOPROXY=https://proxy.golang.org` + `GOSUMDB=sum.golang.org` (không tắt).
- Chỉ thêm module mới sau khi review; nâng cấp có PR riêng, đọc changelog.
- Build tĩnh (`CGO_ENABLED=0`), image distroless chạy user không phải root, filesystem chỉ đọc.
- Tách bí mật: token OAuth và khoá bảng mã hoá AES-GCM trong DB, khoá master ở KMS/Vault, không nằm trong biến môi trường của container chạy integration.
- Truy vấn luôn có tham số (`sqlc`/`pgx`), không ghép chuỗi SQL khi dịch bộ lọc.
- Phân quyền kiểm tra ở server cho mọi request (không tin frontend); ghi audit log thao tác ghi.
- Giới hạn tốc độ (rate limit) cho API công khai và webhook; xác minh chữ ký webhook của Facebook/Zalo/WhatsApp.

### 8.2 Nếu chọn Node.js
- pnpm: tắt script khi cài (`ignore-scripts`/chỉ cho phép package cần build qua `onlyBuiltDependencies`), đặt `minimumReleaseAge` để chỉ cài phiên bản đã phát hành đủ lâu, cài bằng `--frozen-lockfile` trong CI.
- Quét bằng Socket.dev hoặc Snyk ở mỗi PR; bật 2FA và token phát hành có phạm vi hẹp cho mọi tài khoản npm/GitHub.
- Tách tiến trình chạy integration (workflow) khỏi API chính, chỉ cấp đúng bí mật cần dùng.
- Image tối giản (distroless Node), không cài devDependencies ở production.

### 8.3 Frontend (áp dụng ngay, bất kể backend chọn gì)
Frontend **chắc chắn tiếp tục dùng TanStack** (Query, và có thể thêm Router/Table/Form). Vụ tháng 05/2026 là phát hành lậu một số phiên bản trong thời gian ngắn, không phải lỗi của thư viện — dùng tiếp được, miễn là kiểm soát phiên bản.

Kết quả kiểm tra 2026-10-22: `pnpm-lock.yaml` chỉ có `@tanstack/react-query@5.104.1` và `@tanstack/query-core@5.104.1`; đối chiếu thông báo [GHSA-g7cv-rxg3-hmpx](https://github.com/advisories/GHSA-g7cv-rxg3-hmpx) (84 package) → **không dính**. Các package bị chiếm thuộc nhóm Router/SSR, Form, Table… — khi thêm các package đó phải chọn phiên bản sau bản vá (vd `@tanstack/react-router-ssr-query` ≥ 1.166.19, `@tanstack/router-ssr-query-core` ≥ 1.168.7).

Quy tắc dùng TanStack (và mọi package npm):
- Phiên bản khai báo **một chỗ** trong `catalog:` của `pnpm-workspace.yaml`; nâng cấp bằng PR riêng, xem changelog và tra GHSA trước khi merge.
- Chỉ cài phiên bản đã phát hành đủ lâu: thêm `minimumReleaseAge` (phút, vd `4320` = 3 ngày) vào `pnpm-workspace.yaml` — các bản độc hại năm 2026 đều bị gỡ trong vài giờ đến vài ngày.
- Không cho script cài đặt chạy, trừ danh sách cho phép (`onlyBuiltDependencies`); CI luôn `pnpm install --frozen-lockfile`.
- Kiểm tra `pnpm-lock.yaml` với danh sách phiên bản `keyv`/`cacheable`/`flat-cache`/`file-entry-cache` bị chiếm tháng 08/2026 (thường là phụ thuộc gián tiếp của công cụ build/lint).
- Áp dụng các thiết lập pnpm ở mục 8.2 cho monorepo hiện tại.
- Bảo vệ GitHub Actions: khoá action theo commit SHA, quyền token tối thiểu, không dùng secret trong workflow chạy cho PR từ fork.

## 9. Bước tiếp theo đề xuất

1. Xác nhận kỹ năng đội backend (Go hay TypeScript).
2. Làm thử nghiệm nhỏ (1–2 tuần): API bảng + bản ghi (JSONB, lọc, phân trang cursor) và một worker gửi tin Zalo OA bằng Go; đo RAM/CPU và tốc độ làm.
3. Viết OpenAPI + JSON Schema cho cấu hình bảng và cây bộ lọc làm hợp đồng chung.
4. Làm ngay mục 8.3 cho frontend.

## Nguồn

- Sự cố npm: [CSA Singapore AD-2026-009 (keyv)](https://www.csa.gov.sg/alerts-and-advisories/advisories/ad-2026-009/), [Expel: Mini Shai-Hulud](https://expel.com/blog/mini-shai-hulud-cross-ecosystem-supply-chain-worm-targeting-npm-pypl/), [CSA Labs: Mini Shai-Hulud](https://labs.cloudsecurityalliance.org/research/csa-research-note-shai-hulud-ai-supply-chain-20260517-csa-st/), [Unit 42: npm threat landscape](https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/), [Sygnia: Shai-Hulud returns](https://www.sygnia.co/threat-reports-and-advisories/shai-hulud-returns-software-supply-chain-attack-npm-keyv/), [Microsoft: Shai-Hulud 2.0](https://www.microsoft.com/en-us/security/blog/2025/12/09/shai-hulud-2-0-guidance-for-detecting-investigating-and-defending-against-the-supply-chain-attack/), [StepSecurity: AntV](https://www.stepsecurity.io/blog/shai-hulud-here-we-go-again-mass-npm-supply-chain-attack-hits-the-antv-ecosystem)
- Chi phí / hiệu năng: [index.dev 2026](https://www.index.dev/skill-vs-skill/backend-go-vs-nodejs-vs-python-fastapi), [Reintech: Lambda 2026](https://reintech.io/blog/aws-lambda-performance-benchmarks-2026-nodejs-python-go-rust), [Acquaint 2026](https://acquaintsoft.com/blog/fastapi-vs-nodejs-vs-go-performance-benchmarks), [Reintech: microservices 2026](https://reintech.io/blog/go-vs-nodejs-for-microservices-comparison-2026), [Netguru](https://www.netguru.com/blog/golang-vs-node), [Medium: Go vs Node 2026](https://anjan-das.medium.com/beyond-the-hype-5-counter-intuitive-truths-about-go-vs-node-js-in-2026-d40b6c9c941d)
- Bảo mật Go: [CleanStart: go.sum](https://www.cleanstart.com/guide/go-dependency-verification-what-go-sum-proves-and-what-it-doesn-t), [GeekWala: govulncheck](https://www.geekwala.com/blog/go-module-vulnerability-scanning), [Safeguard: Go security 2026](https://safeguard.sh/resources/blog/go-security-best-practices), [Safeguard: sumdb/GOPROXY](https://safeguard.sh/resources/blog/go-module-security-sumdb-goproxy-and-private-modules), [Safeguard: checksum bypass](https://safeguard.sh/resources/blog/go-module-checksum-database-bypass-risks)
- Thiết kế các dự án cùng loại: `docs/opensource-architecture.md`, `docs/opensource-active-tables.md`
