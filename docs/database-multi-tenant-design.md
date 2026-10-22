# Kiến trúc database đa tenant cho Tago

Phiên bản 2 — 2026-10-23. Thay bản nháp 1 ("mỗi workspace một database riêng").

Bản này dựa trên nghiên cứu ở 4 hướng:
1. Larkbase, Airtable, Notion và các SaaS cùng loại.
2. Đọc code thật của Teable, Grist, NocoBase, NocoDB, Baserow, APITable, Plane.
3. Các SaaS lớn: Salesforce, Shopify, Slack, Atlassian, GitLab, Stripe, HubSpot; cùng hướng dẫn của AWS và Azure.
4. Giới hạn kỹ thuật của Postgres khi có nhiều database, và cách migrate hàng loạt.

Ký hiệu: **[F]** = sự thật có nguồn. **[S]** = suy luận của nhóm thiết kế.

---

## 0. Tóm tắt quyết định

1. **Tách DB hệ thống `tago` khỏi DB dữ liệu ngay từ đầu.** Đúng như yêu cầu ban đầu, và mọi hệ thống được nghiên cứu đều làm vậy.
2. **Không tạo database riêng cho mọi workspace.** Mặc định, nhiều workspace dùng chung một "shard" (một Postgres database). Mọi bảng dữ liệu có `workspace_id` đứng đầu khoá chính.
3. **Có bảng định vị (placement)** `workspace → shard`. Code luôn đi qua bộ định tuyến, kể cả khi mới có 1 shard.
4. **Database riêng là một gói (tier)**, không phải mặc định. Khách lớn, khách trả phí cao hoặc khách cần cách ly / chọn vùng dữ liệu sẽ được chuyển sang shard **chỉ chứa mình họ**. Code và schema giữ nguyên, chỉ đổi bản ghi trong bảng định vị. Đây là mô hình "hybrid sharded" của Azure và mô hình "bridge" của AWS.
5. **Công cụ chuyển workspace giữa các shard** (copy → đuổi kịp → khoá ghi ngắn → đổi định vị) được làm sớm. Cùng một công cụ dùng cho nâng gói, cân tải, chọn vùng dữ liệu và nâng cấp Postgres.

Như vậy vẫn có "mỗi khách một database riêng" cho khách cần nó, mà không phải trả chi phí vận hành của hàng nghìn database cho workspace nhỏ hoặc miễn phí.

---

## 1. Các hệ thống khác làm thế nào

### 1.1 Larkbase / Feishu Bitable

- [F] Lark **không công bố** cách lưu trữ bên trong. Phần công khai gồm:
  - engine công thức viết lại bằng Rust, lưu trữ hợp nhất bảng + vector, engine phân tích hàng/cột;
  - giới hạn số dòng theo gói (2.000 / 20.000 / 50.000 dòng, có thể mua thêm), tối đa 300 bảng mỗi Base.
  - Nguồn: [feishu.cn](https://www.feishu.cn/content/wechat_post_35), [InfoQ](https://www.infoq.cn/article/NbHkv9fvR8lemlARRBzL), [Lark help: base limits](https://www.larksuite.com/hc/en-US/articles/890398616778-base-limits-faqs).
- [F] Cách ly tenant công khai ở mức **địa lý**: Feishu (Trung Quốc) và Lark (quốc tế) tách hạ tầng. Mỗi tổ chức chọn vùng lưu dữ liệu; có API chuyển dữ liệu người dùng sang vùng khác ([Lark data residency](https://open.larksuite.com/document/server-docs/security_and_compliance-v1/user_migration/overview?lang=en-US)).
- [F] ByteDance có kho bảng phân tán nội bộ kiểu Spanner (Bytable) ([nguồn](https://cloud.tencent.com/developer/news/648434)).
- [S] Có thể Base được đặt lên kho phân tán nội bộ theo từng Base. Không có dấu hiệu "mỗi khách một database Postgres/MySQL".
  - → "Giống Larkbase" nên hiểu là **cách ly dữ liệu chặt + chọn được vùng lưu**, chưa có bằng chứng rằng họ dùng mỗi khách một database vật lý.

### 1.2 Các sản phẩm cùng loại (bảng / workspace)

| Sản phẩm | Đơn vị chia | Bố cục vật lý | Định tuyến | Chuyển tenant | Nguồn |
|---|---|---|---|---|---|
| **Airtable** | Base | Nhiều "base shard" MySQL + **1 main shard** cho user/workspace | Hệ quản lý shard quyết định base mới ở đâu | Có: chuyển base giữa shard khi tải cao / lỗi phần cứng | [F] [Airtable MySQL 8](https://www.umbrant.com/2025/02/07/migrating-airtable-to-mysql-8-0-2/) |
| **Notion** | workspace → 480 shard logic | Mỗi shard logic là 1 schema; 32 → 96 máy Postgres | Bảng ánh xạ trong app | Chuyển cả schema bằng logical replication | [F] [Sharding](https://www.notion.com/blog/sharding-postgres-at-notion), [Re-shard](https://www.notion.com/blog/the-great-re-shard) |
| **ClickUp** | microshard (schema chứa nhiều workspace) | Nhiều schema `sh0001…` trên nhiều máy | Hàm tra cứu | Chuyển live bằng logical replication; công cụ `pg-mig` migrate mọi shard | [F] [pg-microsharding](https://www.npmjs.com/package/@clickup/pg-microsharding) |
| **Asana** | workspace | MySQL shard | Bảng định tuyến + khoá shard trong mỗi transaction | Copy → copy lại phần đổi → đổi định tuyến (vài giây) | [F] [Asana](https://asana.com/inside-asana/sharding-is-bitter-medicine) |
| **Figma** | user / file / org | Postgres chia theo hash | Proxy SQL viết bằng Go | Đang làm | [F] [Figma](https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/) |
| **Linear** | workspace → vùng | Cả hệ thống nhân bản theo vùng; 1 DB auth toàn cục | Edge proxy | Chưa hỗ trợ | [F] [Linear](https://linear.app/now/how-we-built-multi-region-support-for-linear) |
| **monday.com** | board | Từng là JSON trong MySQL dùng chung → nay mỗi board 1 file DuckDB | Hash theo tenant | Mất 18 tháng chuyển đổi | [F] [mondayDB 3](https://engineering.monday.com/mondaydb-3-solving-htap-for-a-trillion-table-system/) |

Bài học trực tiếp cho Tago:
- [F] Notion: *"lẽ ra nên shard sớm hơn"*; đợt chuyển đầu vẫn phải dừng hệ thống 5 phút.
- [F] monday.com: JSON trong bảng dùng chung khó lọc/sắp xếp khi bảng lớn. → Tago phải có index biểu thức cho trường hay lọc, giới hạn số dòng theo gói, và đường phân tích riêng (cột) cho bảng rất lớn.
- [F] Airtable: lịch sử thay đổi phình tới hàng petabyte, sau phải chuyển sang S3/Parquet theo base; chi phí lưu giảm khoảng 100 lần. → Tách lịch sử / log khỏi DB nóng từ đầu.

### 1.3 Code mã nguồn mở (đã đọc trực tiếp)

| Dự án | Đơn vị tenant | Dữ liệu nằm ở đâu | Định tuyến | Pool kết nối | Migration nhiều tenant |
|---|---|---|---|---|---|
| **Teable** | space (định tuyến), base (schema) | Schema mỗi base trong data DB; DB riêng mỗi space là tuỳ chọn (BYODB) | id → space → binding trong meta DB, cache theo request | 1 pool mỗi DSN, đếm tham chiếu | Chủ động lúc khởi động + lười khi truy cập; advisory lock, checksum, `schema_version` |
| **Grist** | document | 1 file SQLite mỗi doc, S3 là nguồn đúng | Redis gán doc → worker | Không cần (1 tiến trình ghi) | Lười khi mở doc, **backup trước khi migrate** |
| **NocoBase** | app | DB riêng mỗi app (hoặc schema nếu bật cờ) | hostname → app | Mỗi app 1 pool Sequelize | Vòng lặp tuần tự qua mọi app — điểm nghẽn |
| **NocoDB** | base | Schema mỗi base, chung DB | Tra source | **Pool riêng mỗi base** → lỗi "too many clients" (issue #5806) | Chỉ meta DB |
| **Baserow** | không chia | Bảng SQL thật mỗi bảng người dùng | — | — | Hết bộ nhớ khoá (`max_locks_per_transaction`); backup phải chia lô 60 bảng |
| **APITable / Plane** | space / workspace | Bảng dùng chung, có cột tenant | `WHERE` theo tenant | 1 pool | Chạy 1 lần |

Chi tiết từ code Teable (`packages/db-main-prisma/prisma/template.prisma`):
- [F] Teable đã thiết kế đúng hướng "DB riêng là tuỳ chọn" với các bảng:
  - `DataDbConnection` (DSN mã hoá, `schemaVersion`, trạng thái sức khoẻ);
  - `SpaceDataDbBinding` (`mode default|byodb`, trạng thái `ready|migrating|…`);
  - `SpaceDataDbMigrationJob` (`preflight → freezing_writes → copying → validating → switching → succeeded/rolled_back`).
- [F] Teable có ghi chú cấm "rơi về meta DB" khi space đã gắn DB riêng (tránh bảng ma). Họ cũng không tin `search_path` qua PgBouncer, nên mọi câu SQL đều ghi rõ schema.

### 1.4 Các SaaS lớn và hướng dẫn của AWS / Azure

**Hướng dẫn chung**
- [F] AWS SaaS Lens chia ba mô hình: **silo** (riêng), **pool** (chung), **bridge** (trộn), và **phân tầng theo gói**: gói thường dùng chung, gói cao cấp riêng — nhưng cùng một phiên bản phần mềm, không tuỳ biến riêng ([AWS](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html)).
- [F] Azure: *"đổi mô hình về sau thường tốn kém"*. Mô hình **hybrid sharded**:
  - mọi DB có `tenant_id`, có DB chỉ chứa 1 tenant;
  - tenant chuyển được hai chiều;
  - cần **catalog** tenant → DB, và `tenant_id` là **cột đầu của mọi khoá chính**.
  - Azure chỉ coi "mỗi tenant một DB" là khả thi nhờ nền tảng của họ tự động hoá backup/HA cho hơn 100 nghìn DB ([Azure](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns)).

**Từng công ty**
- [F] **Salesforce**: một DB dùng chung, mọi dòng có `OrgID`; đối tượng tuỳ biến là **metadata**, không bao giờ chạy DDL theo tenant ([Salesforce](https://architect.salesforce.com/docs/architect/fundamentals/guide/platform-multitenant-architecture.html)). Gần nhất với Tago (bản ghi JSONB + cấu hình JSON).
- [F] **Shopify**: "pod" = shard MySQL chứa nhiều shop; bảng định tuyến shop → pod; chuyển shop bằng Ghostferry, thường dừng dưới 10 giây. Làm được vì **mọi bảng có `shop_id`** ([Shopify](https://shopify.engineering/mysql-database-shard-balancing-terabyte-scale)).
- [F] **Stripe**: cùng một công cụ vừa gộp shard ít tải vừa chuyển khách lớn sang DB riêng; đã chuyển 1,5 PB, giảm khoảng 75% số shard ([Stripe](https://stripe.dev/blog/how-stripes-document-databases-supported-99.999-uptime-with-zero-downtime-data-migrations)).
- [F] **Atlassian Jira** — bài học quan trọng nhất về "mỗi tenant một DB":
  - khoảng **4 triệu database Postgres trên khoảng 3.000 máy**, tới 4.000 DB mỗi máy, mỗi DB khoảng 5.000 file;
  - khi chuyển sang Aurora, máy nhiều file bị timeout lúc khởi động, phải "rút – nâng – nạp lại" tối đa 90 nghìn DB mỗi ngày, kéo dài nhiều tháng ([Atlassian](https://www.atlassian.com/blog/atlassian-engineering/migrating-jira-database-platform-to-aws-aurora));
  - Atlassian Forge (dùng chung cho đa số + DB riêng cho 1% lớn nhất) phình tới hơn 750 cluster rồi phải gộp về khoảng 16 cluster TiDB ([PingCAP](https://www.pingcap.com/blog/how-atlassian-scaled-three-million-tables-multi-tenancy-tidb/)).
- [F] **Slack**: mỗi workspace một shard MySQL → khách lớn vượt máy lớn nhất, shard nóng/nguội lệch nhau, tính năng chéo workspace khó làm → mất 3 năm chuyển sang Vitess ([Slack](https://slack.engineering/scaling-datastores-at-slack-with-vitess/)).
- [F] **GitLab Cells**: mọi bảng của khách phải có khoá chia; ID duy nhất toàn cục do dịch vụ trung tâm cấp ([GitLab](https://docs.gitlab.com/development/cells/)).
- [F] **HubSpot**: tách EU bằng nhân bản cả nền tảng ("Hublet"), tốn hơn 10.000 PR ([HubSpot](https://product.hubspot.com/blog/developing-an-eu-data-center)).

### 1.5 Giới hạn của Postgres với nhiều database

**Khuyến nghị của các nhà cung cấp**
- [F] Crunchy Data: DB mỗi tenant chỉ hợp với **vài chục** tenant (*"dự kiến từ 50 khách trở lên thì tránh"*); schema mỗi tenant cho **vài trăm**; cột tenant cho **hàng triệu** ([Crunchy](https://www.crunchydata.com/blog/designing-your-postgres-database-for-multi-tenancy)).
- [F] Heroku: *"khuyến nghị mạnh không dùng"* schema mỗi khách; trên 50 schema làm chậm pg_dump/backup, trên 1.000 schema có nguy cơ hết RAM khi nâng phiên bản ([Heroku](https://devcenter.heroku.com/articles/connecting-heroku-postgres)).

**Vì sao số database lớn gây khó**
- [F] **Autovacuum**: launcher cố khởi động một worker cho mỗi DB sau mỗi `autovacuum_naptime`. Với 5.000 DB thì cứ ~12 ms khởi động một worker. Mỗi DB có mốc chống tràn transaction ID riêng phải theo dõi ([PG docs](https://www.postgresql.org/docs/17/routine-vacuuming.html)). Có báo cáo cluster 15.000 DB mà launcher "không bao giờ nghỉ" ([pgsql-general](https://www.postgresql.org/message-id/8f4455bc-fc64-f8b3-1053-7be9085d58a8%40gmail.com)).
- [F] **Catalog**: mỗi DB có bản catalog riêng (DB rỗng khoảng 7–8 MB). Nhiều bảng làm cache catalog của mỗi kết nối phình từ 4 MB lên 221 MB ([Cybertec](https://www.cybertec-postgresql.com/en/too-many-tables-are-bad/)).
- [F] **Kết nối**: một kết nối Postgres chỉ vào được một DB. PgBouncer pool theo cặp (user, db), nên số kết nối tăng theo số DB ([PgBouncer](https://www.pgbouncer.org/config.html)).
- [F] **Logical replication / CDC**: mỗi slot chỉ đọc một DB → 5.000 DB cần 5.000 slot ([PG docs](https://www.postgresql.org/docs/17/logicaldecoding-explanation.html)). Nghĩa là gần như không làm được CDC sang kho phân tích.
- [F] **Nâng phiên bản lớn**: pg_upgrade dump schema của mọi DB; trên 90 nghìn bảng thì riêng bước này đã hơn 5 giờ ([thread](https://postgrespro.com/list/thread-id/1233849)).
- [F] **Backup**: pgBackRest backup theo cluster; khôi phục 1 DB vẫn phải phát lại toàn bộ WAL ([pgBackRest](https://pgbackrest.org/user-guide.html)).

**Kinh nghiệm thực tế**
- [F] Trên HN có người gọi "mỗi khách một DB/schema" là *"một trong những điều hối tiếc nhất"* ở mức khoảng 150 khách. Tác giả gem Apartment (schema mỗi tenant) đã bỏ cách này vì mỗi lần migrate phải chạy N lần, làm CI/CD "gần như không thể" ([HN](https://news.ycombinator.com/item?id=23305111), [Arkency](https://blog.arkency.com/peoples-experiences-with-approaches-to-multitenancy/)).
- [F] Nền tảng duy nhất làm "mỗi tenant một DB" rẻ là loại đã xoá chi phí mỗi DB: Neon (project mỗi tenant, tới 5.000+), Turso/D1 (SQLite), Nile (Postgres ảo hoá theo tenant — thực chất là bảng dùng chung có `tenant_id`) ([Neon](https://neon.com/docs/guides/multitenancy), [Nile](https://www.thenile.dev/docs/tenant-virtualization/tenant-management)).

### 1.6 Kết luận rút ra

| | DB riêng mỗi workspace | Schema riêng mỗi workspace | **Shard dùng chung + định tuyến + DB riêng theo gói (chọn)** |
|---|---|---|---|
| Cách ly | Mạnh | Trung bình | Logic trong shard (+ RLS); mạnh cho khách có DB riêng |
| Chi phí mỗi tenant | Cao | Thấp | Thấp; khách DB riêng trả qua giá gói |
| Migration | N lần (hàng nghìn) | N lần | Số shard lần (vài đến vài chục) |
| Kết nối | Pool mỗi DB (tệ nhất) | Chung pool nhưng `search_path` dễ lỗi qua PgBouncer | Pool mỗi shard |
| CDC / phân tích | N slot | 1 slot | Mỗi shard 1 slot |
| Chuyển tenant | Dễ (cả DB) | Dump 1 schema | Có công cụ (copy theo `workspace_id`) |
| Đổi mô hình về sau | Rất khó (Atlassian, Slack) | Rất khó (Apartment) | Đã sẵn: shard chung ↔ DB riêng ↔ cluster riêng ↔ Citus |

[S] Tago lưu bản ghi bằng JSONB và cấu hình bảng bằng JSON, nên **schema vật lý của mọi workspace giống hệt nhau và rất ít bảng**. Đây đúng là trường hợp bảng dùng chung có lợi nhất. Tách DB cho mọi workspace chỉ tốn thêm N lần chi phí mà không thu thêm được gì về mặt mô hình dữ liệu.

---

## 2. Kiến trúc

```
                       ┌───────────────────────────────┐
  đăng nhập, chọn      │  DB tago  (control plane)     │ users, sessions, workspaces, members,
  workspace, billing ─►│  1 DB, HA, có replica đọc     │ plans, data_shards, workspace_placements,
                       └──────────────┬────────────────┘ public_routes, api_tokens, schedules, keys
                                      │ workspace_id → shard (cache trong RAM + Redis, xoá theo sự kiện)
          ┌───────────────────────────┼──────────────────────────────┐
          ▼                           ▼                              ▼
 ┌──────────────────┐       ┌──────────────────┐          ┌──────────────────┐
 │ shard s001 (pool)│       │ shard s002 (pool)│   ...    │ shard d_acme     │
 │ DB tago_s001     │       │ DB tago_s002     │          │ (dedicated:      │
 │ hàng nghìn       │       │ hàng nghìn       │          │  chỉ 1 workspace,│
 │ workspace nhỏ    │       │ workspace nhỏ    │          │  cluster riêng)  │
 └──────────────────┘       └──────────────────┘          └──────────────────┘
   Cùng một bộ migration "data", cùng schema, mọi bảng có workspace_id đứng đầu khoá.
```

- **Shard** = một Postgres database dùng schema "data" chuẩn của Tago. Nhiều shard có thể nằm trên một cluster. Có hai loại:
  - `pool`: chứa nhiều workspace, mặc định cho mọi workspace mới.
  - `dedicated`: chỉ chứa 1 workspace, thường đặt trên cluster riêng hoặc ở vùng riêng.
- **Giai đoạn đầu**: 1 cluster chứa DB `tago` + 1 shard `tago_s001`. Code vẫn đi qua bộ định tuyến như khi đã có nhiều shard.
- **Khi lớn lên**: thêm shard → workspace mới vào shard mới. Shard quá tải → chuyển bớt workspace sang shard khác. Khách cần cách ly → chuyển sang shard dedicated.

---

## 3. Điều bất biến (quy tắc cứng — khó sửa nhất về sau)

Đây là phần "migrate về sau siêu khó". Từ bản đầu tiên, code và schema phải tuân thủ những điều sau. Đổi phần khác thì dễ; đổi những điều này là đại phẫu.

| # | Quy tắc | Lý do / nguồn |
|---|---|---|
| I1 | Mọi bảng dữ liệu tenant có cột `workspace_id NOT NULL`, **là cột đầu của khoá chính** `(workspace_id, id)` và của mọi index / unique | Chuyển tenant, Citus, RLS, xoá tenant đều dựa vào đây [F] Azure, Shopify, GitLab, Notion |
| I2 | **Giữ `workspace_id` cả trong shard dedicated** | Một bộ schema duy nhất; chuyển hai chiều không phải đổi gì [F] Azure hybrid |
| I3 | ID duy nhất toàn cục (UUIDv7, lưu kiểu `uuid`; tiền tố `rec_`… chỉ ở tầng API). Không dùng sequence của DB làm ID; số tự tăng theo bảng (`AUTO_GENERATED_CODE`) là bộ đếm riêng theo `(workspace_id, table_id)` | Chuyển dữ liệu không phải đánh số lại [F] HubSpot, GitLab |
| I4 | Không JOIN / FK chéo workspace, không JOIN chéo DB (DB `tago` ↔ shard). Cần dữ liệu bên kia thì gọi Service hoặc dùng bản sao | Shard có thể nằm ở máy / vùng khác |
| I5 | Mọi truy cập dữ liệu tenant đi qua `tenant.Conn(ctx)` của bộ định tuyến; không có "pool mặc định" cho dữ liệu tenant | [F] Teable cấm rơi về meta DB |
| I6 | Mọi câu SQL ghi rõ schema / không phụ thuộc `search_path`; biến phiên chỉ dùng `SET LOCAL` trong transaction | [F] PgBouncer transaction mode bỏ `SET` thường |
| I7 | Migration schema data chỉ **expand/contract**: không đổi tên / xoá cột trong cùng đợt thêm; code chạy được trên schema N và N+1 | Rollout trên nhiều shard không xong cùng lúc [F] Grist, Atlas, pg-mig |
| I8 | Thêm / sửa / xoá trường của bảng người dùng **không chạy DDL** (JSONB + cấu hình); index biểu thức cho trường hay lọc do engine tạo, có tên xác định, ghi vào sổ index | [F] Salesforce, Baserow (DDL theo người dùng → bùng catalog, hết bộ nhớ khoá) |
| I9 | Tệp S3 có tiền tố `ws/<workspace_id>/…`; khoá Redis, hàng đợi, sự kiện đều mang `workspace_id` | Xoá / chuyển / xuất tenant theo tiền tố |
| I10 | Bảng nối dài (lịch sử, log workflow, audit, tin nhắn) phân vùng theo thời gian, có chính sách giữ / lưu trữ ra S3 | [F] Airtable: lịch sử tới mức petabyte |

---

## 4. DB `tago` (control plane)

```sql
-- Tài khoản, phiên
users(id uuid PK, email citext unique, username unique, full_name, avatar_key, password_hash,
      locale, status, email_verified_at, created_at, updated_at)
user_identities(provider, subject, user_id, PRIMARY KEY(provider, subject))
refresh_tokens(id, user_id, token_hash unique, family_id, expires_at, revoked_at, ip, user_agent, created_at)
one_time_tokens(id, user_id, kind, token_hash unique, expires_at, used_at)
user_preferences(user_id PK, last_workspace_id, settings jsonb)

-- Workspace, thành viên (mức "ai vào được"), lời mời
workspaces(id uuid PK, name, namespace unique, owner_id, plan_id, region, timezone,
           status /* active|suspended|deleting|deleted */, created_at, updated_at, deleted_at)
workspace_members(workspace_id, user_id, status, joined_at, PRIMARY KEY(workspace_id, user_id))
invitations(id, workspace_id, email, invited_user_id, team_id, role_id, status, token_hash, expires_at, created_by, created_at)

-- Định vị dữ liệu (catalog)
db_clusters(id, region, host, port, admin_secret_ref, status /* open|full|draining */)
data_shards(id /* s001, d_acme */, cluster_id, db_name unique, kind /* pool|dedicated */,
            dsn_secret_ciphertext bytea, key_id, schema_version bigint,
            status /* provisioning|ready|migrating|draining|readonly|retired */,
            max_workspaces, workspace_count, size_bytes, updated_at)
workspace_placements(workspace_id PK, shard_id, epoch bigint /* tăng mỗi lần đổi shard */,
                     state /* active|moving|frozen */, placement_policy /* pool|dedicated */,
                     updated_at)
workspace_moves(id, workspace_id, from_shard, to_shard,
                state /* preflight|copying|catching_up|frozen|validating|switched|cleaned|failed|rolled_back */,
                stats jsonb, error, started_at, finished_at)

-- Khoá tra cứu toàn cục cho request chưa biết workspace
public_routes(key PK, kind /* form|webhook|share|oauth_state */, workspace_id, target_id, expires_at)
api_tokens(id, workspace_id, user_id, name, token_hash unique, scopes jsonb, last_used_at, expires_at, revoked_at)

-- Gói cước, hạn mức, khoá mã hoá
plans(id, code unique, limits jsonb)
subscriptions(workspace_id PK, plan_id, status, current_period_end, external_ref)
usage_counters(workspace_id, metric, period, value, PRIMARY KEY(workspace_id, metric, period))
workspace_keys(workspace_id, version, dek_ciphertext bytea, kms_key_id, created_at, retired_at,
               PRIMARY KEY(workspace_id, version))

-- Hẹn giờ toàn cục, outbox hệ thống, vận hành
schedules(id, workspace_id, kind, ref_id, cron, timezone, next_run_at, enabled)
system_outbox(id bigserial, topic, payload jsonb, created_at, published_at)
shard_migration_runs(id, shard_id, from_version, to_version, status, started_at, finished_at, error)
platform_audit_logs(id bigserial, actor_id, action, workspace_id, details jsonb, ip, created_at)
```

- **Đọc định vị**: cache trong RAM mỗi tiến trình (TTL ngắn) + kênh Redis xoá cache khi `epoch` đổi; giống Tenant Context Service của Atlassian [F].
- DB `tago` là điểm lỗi chung (Airtable gọi main shard là SPOF [F]) → cần HA (primary + standby) và replica đọc ngay từ khi lên production.

## 5. Shard data (schema giống nhau ở mọi shard)

```sql
shard_info(singleton bool PK default true CHECK(singleton), shard_id, created_at)  -- kiểm tra khi mở pool
workspace_epochs(workspace_id PK, epoch bigint, frozen bool)   -- khoá đọc ở mỗi transaction ghi (mục 6)

member_profiles(workspace_id, user_id, full_name, email, avatar_key, status, synced_at,
                PRIMARY KEY(workspace_id, user_id))            -- bản sao từ DB tago
teams(workspace_id, id, …, PRIMARY KEY(workspace_id, id))
team_roles, team_members, labels, permissions                  -- cùng quy tắc khoá
work_groups, tables(workspace_id, id, config jsonb, config_version, …)
records(workspace_id, table_id, id, data jsonb, items jsonb, sort_key numeric, revision bigint,
        created_by, updated_by, created_at, updated_at, deleted_at, search tsvector,
        PRIMARY KEY(workspace_id, id))
  -- index: (workspace_id, table_id, sort_key, id) WHERE deleted_at IS NULL
  --        GIN(data jsonb_path_ops); index biểu thức theo trường do engine tạo
record_refs, record_comments, attachments, import_jobs, sequences(workspace_id, table_id, field, value)
record_history   (phân vùng theo tháng)
changesets, outbox(id bigserial, workspace_id, topic, payload, created_at, published_at)
workflow_units, workflow_events, workflow_executions, workflow_jobs
workflow_logs    (phân vùng theo ngày, giữ 7–30 ngày)
forms, connectors, social_settings, conversations, messages (phân vùng theo tháng)
notifications, audit_logs (phân vùng theo tháng)
```

- **RLS làm lớp an toàn thứ hai** [S]:
  - bật `ROW LEVEL SECURITY` trên bảng tenant, policy `workspace_id = current_setting('tago.ws')::uuid`;
  - bộ định tuyến chạy `SET LOCAL tago.ws = $1` đầu mỗi transaction;
  - role ứng dụng không phải owner bảng, nên không bỏ qua được RLS.
  - Code vẫn luôn tự viết `WHERE workspace_id = $1`; RLS chỉ là lưới an toàn khi quên.
- **`records` lớn**: phân vùng `HASH (workspace_id)` khoảng 16 phần ngay từ đầu [S]. Vacuum chia nhỏ hơn; đổi về sau sẽ khó vì phải viết lại cả bảng.

## 6. Định tuyến trong Go

```
request /v1/workspaces/{ws}/…
  └─ middleware TenantResolver
       1. JWT → user_id; kiểm tra (ws, user) ∈ workspace_members        [DB tago, cache]
       2. workspace_placements(ws) → shard_id, epoch, state             [cache, xoá theo epoch]
          state=frozen → 503 + Retry-After (đang chuyển shard)
       3. shards.Pool(shard_id) → *pgxpool.Pool  (1 pool mỗi shard, KHÔNG phải mỗi workspace)
       4. ctx = tenant.With(ctx, ws, shard_id, epoch)
  └─ repository: tenant.Tx(ctx, func(tx) …)
       BEGIN; SET LOCAL tago.ws = $ws;
       SELECT epoch, frozen FROM workspace_epochs WHERE workspace_id=$ws FOR SHARE;
         → epoch khác hoặc frozen → huỷ, xoá cache, trả 503 (client thử lại)
       … truy vấn sqlc …
       COMMIT
```

- **Khoá epoch** theo cách Asana [F] đảm bảo không ghi nhầm vào shard cũ khi đang chuyển workspace. Chỉ cần ở transaction ghi; đọc thì chấp nhận cache cũ vài giây.
- **Pool**: `map[shard_id]*pgxpool.Pool`, `MaxConns` 10–30 mỗi tiến trình mỗi shard. PgBouncer ≥ 1.21 transaction mode, `max_prepared_statements` khoảng 100–200; Postgres `max_connections` 300–500 [S, cần đo]. Tránh kiểu NocoDB tạo pool theo từng tenant [F].
- Khi mở pool, kiểm tra `shard_info.shard_id` phải khớp — chặn cấu hình nhầm DSN.

## 7. Thao tác chạm cả DB `tago` và shard

Không có transaction chéo DB. Dùng **outbox + handler idempotent** và **trạng thái `provision_state`** (giống Teable [F]):

| Thao tác | DB `tago` | Shard |
|---|---|---|
| Tạo workspace | `workspaces`, `workspace_members(owner)`, chọn shard (pool còn chỗ, cùng vùng), `workspace_placements(state=active)`, `workspace_keys`, outbox `workspace.created` | Handler: tạo `workspace_epochs`, `member_profiles(owner)`, team/role mặc định. Chưa xong thì giao diện hiện "Đang khởi tạo" |
| Chấp nhận lời mời / xoá thành viên | `workspace_members`, outbox | upsert / đánh dấu `member_profiles`, `team_members` |
| Đổi tên / avatar | `users`, outbox | cập nhật `member_profiles` ở mọi workspace người đó tham gia |
| Xuất bản form, tạo webhook | (sau sự kiện từ shard) upsert `public_routes` | `forms` / `connectors` + outbox |
| Bật cron workflow | upsert `schedules` | `workflow_events` + outbox |

Quyền truy cập luôn kiểm tra theo `workspace_members` trong DB `tago` → người bị xoá mất quyền ngay. Job đối soát hằng đêm sửa lệch giữa hai bên.

## 8. Migration

```
apps/backend/migrations/
├── system/   # DB tago — chạy 1 lần
└── data/     # mọi shard — cùng một bộ file
```

- Lệnh: `tago migrate system`, `tago migrate shards [--shard s001] [--canary] [--concurrency 4]`.
- Thứ tự: shard nội bộ / canary → các shard pool → các shard dedicated.
  - Mỗi shard: `pg_advisory_lock`, `lock_timeout` và `statement_timeout`, checksum file migration (giống Teable [F]).
  - Ghi kết quả vào `data_shards.schema_version` và `shard_migration_runs`.
- Shard lỗi: đánh dấu, **dừng rollout nếu tỉ lệ lỗi vượt ngưỡng**, không chạy tiếp vô điều kiện.
- Code khai báo `MinDataSchema`; shard có `schema_version` thấp hơn → bộ định tuyến từ chối (503) thay vì chạy sai.
- Index lớn dùng `CREATE INDEX CONCURRENTLY` (goose `NO TRANSACTION`); thêm cột không đặt default biến động; backfill bằng job theo lô, không chạy trong migration.
- Số shard chỉ vài đến vài chục, nên migration xong trong vài phút. Với "mỗi workspace một DB", cùng việc này phải chạy hàng nghìn lần, kèm đuôi dài các DB lỗi [F] HN 43812055.

## 9. Chuyển workspace giữa shard (công cụ cốt lõi)

Dùng cho: nâng lên gói DB riêng, hạ gói, cân tải, chọn vùng dữ liệu, rút máy để nâng cấp Postgres.

```
preflight   kiểm tra cùng schema_version, dung lượng đích, ước lượng kích thước
copying     copy theo workspace_id từ từng bảng (COPY … WHERE workspace_id=$ws), bỏ index phụ
            khi copy rồi tạo sau (Notion: 3 ngày → 12 giờ [F])
catching_up đọc outbox/changesets từ mốc bắt đầu để áp phần thay đổi,
            hoặc logical replication có lọc dòng (PG15+ publication WHERE)
frozen      workspace_epochs.frozen=true ở nguồn (ghi bị 503 vài giây), áp nốt phần chênh
validating  so số dòng + checksum theo bảng
switched    workspace_placements.shard_id = đích, epoch+1 → xoá cache định tuyến
cleaned     sau thời gian giữ (vd 7 ngày) xoá dữ liệu ở nguồn theo lô
```

- Workspace nhỏ (đa số khách SMB): toàn bộ quá trình vài giây đến vài phút.
- Có `rolled_back`: trước `switched` chỉ cần bỏ đích; sau `switched` thì chuyển ngược lại bằng chính công cụ này.
- Kiểm thử định kỳ trên staging: chuyển ngẫu nhiên workspace qua lại giữa 2 shard, so sánh dữ liệu.

## 10. Backup, khôi phục, xuất, xoá

- **Theo cluster**: pgBackRest (backup vật lý + WAL, có PITR), chi tiết ở mục 13.1.
- **Khôi phục 1 workspace**: PITR shard vào DB tạm → dùng công cụ mục 9 copy workspace đó về (hoặc chỉ các bảng / bản ghi cần) [S]. Có `workspace_id` ở mọi bảng nên làm được.
- **Xuất cho khách**: job xuất logic theo `workspace_id` (JSON/Excel + tệp S3 theo tiền tố).
- **Xoá workspace**:
  1. `status=deleting`, ân hạn 30 ngày.
  2. Xoá theo lô `DELETE … WHERE workspace_id=$1` (nếu `records` phân vùng theo hash, vẫn là xoá theo lô trong phân vùng).
  3. Xoá tiền tố S3, xoá `workspace_keys` (crypto-shredding cho dữ liệu còn trong backup).
  4. `status=deleted`.
- **Khách dedicated**: có thêm `pg_dump` riêng hằng đêm và xoá bằng `DROP DATABASE`.

## 11. Outbox, hàng đợi, hẹn giờ

- Mỗi shard có một `outbox`, relay chạy **mỗi shard một vòng** (vài đến vài chục vòng, không phải hàng nghìn). Có thể dùng logical replication / CDC mỗi shard 1 slot để đẩy sang Kafka / NATS và kho phân tích về sau.
- Message hàng đợi luôn mang `workspace_id`; worker tra định vị như API. Giới hạn đồng thời theo workspace (Redis semaphore) để một khách không chiếm hết worker.
- Scheduler chỉ quét `schedules` trong DB `tago`; node "Trì hoãn" ghi `resume_at` trong `workflow_jobs` của shard + một dòng đánh thức ở DB `tago` (hoặc Redis ZSET) để không phải quét mọi shard.

## 12. Ngưỡng tách shard (khởi điểm, cần đo)

| Chỉ số | Ngưỡng đề xuất [S] |
|---|---|
| Kích thước một shard pool | 300–500 GB, hoặc khoảng 1–2 tỷ bản ghi, hoặc CPU p95 > 60% |
| Workspace mỗi shard pool | Không giới hạn cứng; đặt `max_workspaces` khoảng 5.000–20.000 để chia đều |
| Workspace → dedicated | > 5–10 triệu bản ghi, hoặc tải ghi cao kéo dài, hoặc yêu cầu hợp đồng / cách ly / chọn vùng |
| Số dòng mỗi bảng theo gói | Giống Lark / Airtable: giới hạn theo gói (vd 20k / 100k / 1M), vượt thì nâng gói |

## 13. Triển khai trên máy chủ vật lý (tự vận hành)

Quyết định 2026-10-23: chạy trên **server vật lý**, không dùng dịch vụ managed. Như vậy HA, backup, giám sát và nâng cấp Postgres đều do đội tự làm. Các con số dưới đây là khởi điểm [S], cần đo lại bằng tải thật.

### 13.1 Sơ đồ tối thiểu khi lên production

```
             ┌──────────── VLAN riêng cho DB (chỉ app host vào được) ────────────┐
 app-1 ─┐    │  db-1 (primary)      db-2 (standby đồng bộ)     witness-1         │
 app-2 ─┼──► │  Postgres 17         Postgres 17                 etcd             │
        │    │  Patroni + etcd      Patroni + etcd              (không chạy PG)  │
 PgBouncer   │  ── replication đồng bộ ──►                                       │
 trên mỗi    │  DB: tago, tago_s001 (cùng cluster ở giai đoạn đầu)               │
 app host    └───────────────────────────────────────────────────────────────────┘
                      │ WAL + backup (pgBackRest, mã hoá)
                      ▼
             backup-1 (máy riêng, khác tủ rack) ──► bản thứ 2 ngoài trung tâm dữ liệu
                                                    (MinIO/S3 ở DC khác, hoặc NAS off-site)
```

| Thành phần | Lựa chọn | Ghi chú |
|---|---|---|
| HA Postgres | **Patroni + etcd (3 node)** | Tự chuyển primary khi máy chết; `synchronous_mode: true` để không mất giao dịch đã commit khi failover. Witness chỉ chạy etcd để đủ quorum 3 |
| Đi tới primary | PgBouncer trên mỗi app host → HAProxy (kiểm tra `/primary` của Patroni) hoặc vip-manager (IP ảo) | App không cần biết máy nào đang là primary |
| Pool | PgBouncer ≥ 1.21, transaction mode, `max_prepared_statements` 100–200 | Mỗi shard một pool phía Go (mục 6) |
| Backup | **pgBackRest**: full hằng tuần, differential hằng ngày, WAL archive liên tục; 2 repo (máy backup trong DC + bản off-site), mã hoá `repo-cipher-type=aes-256-cbc` | Giữ 14–30 ngày; `archive_timeout=60s` → mất tối đa khoảng 1 phút nếu mất cả cụm |
| Diễn tập khôi phục | Job hằng tuần: restore bản mới nhất vào máy staging, chạy kiểm tra số dòng / checksum, báo kết quả | Backup chưa khôi phục thử thì coi như chưa có |
| Tệp đính kèm | MinIO phân tán (≥ 4 node, erasure coding) hoặc ban đầu 1 node + nhân bản off-site | Tiền tố `ws/<workspace_id>/` (I9) |
| Redis | Redis Sentinel 3 node (hoặc NATS JetStream cluster 3 node) | Hàng đợi, pub/sub, cache, khoá |
| Khoá master (KMS) | **OpenBao / HashiCorp Vault** tự vận hành, Transit engine, 3 node (Raft) | Mã hoá DEK trong `workspace_keys` và DSN trong `data_shards`; khoá unseal chia cho nhiều người giữ |
| Giám sát | postgres_exporter + node_exporter → SigNoz (đã có) | Cảnh báo: replication lag, disk > 70%, `age(datfrozenxid)`, số kết nối, backup quá 26 giờ, Patroni đổi primary |

### 13.2 Phần cứng và cấu hình (khởi điểm)

- **Máy DB**: 16–32 core, 128 GB RAM ECC, NVMe SSD RAID10 (dung lượng gấp khoảng 3 lần dữ liệu dự kiến năm đầu), 2 nguồn điện, card mạng 10 GbE; có UPS.
- **Hệ điều hành**: XFS hoặc ext4 (`noatime`), `vm.swappiness=1`, `vm.overcommit_memory=2`, huge pages cho `shared_buffers`, tắt transparent huge pages.
- **Postgres**: `shared_buffers` khoảng 25% RAM, `effective_cache_size` khoảng 70%, `max_connections` 300–500 (PgBouncer gánh phần còn lại), `wal_compression=on`, `checkpoint_timeout=15min`, autovacuum mạnh tay hơn mặc định cho `records`.
- **Mã hoá ổ đĩa (LUKS)** trên máy DB và máy backup: máy vật lý có thể bị tháo ổ hoặc thanh lý.
- **Mạng**: DB nằm trong VLAN riêng; firewall chỉ mở cho app host và máy backup; `pg_hba` dùng `scram-sha-256` + TLS; không mở cổng Postgres ra Internet.

### 13.3 Vận hành định kỳ

| Việc | Cách làm |
|---|---|
| Nâng phiên bản nhỏ (17.x) | Rolling: nâng standby → `patronictl switchover` → nâng máy cũ. Gián đoạn vài giây |
| Nâng phiên bản lớn (17 → 18) | Dựng cluster mới ở phiên bản mới → chuyển từng shard sang (logical replication cả DB, hoặc công cụ chuyển workspace mục 9) → đổi `data_shards`. Không cần `pg_upgrade` tại chỗ |
| Thêm shard | Dựng DB `tago_s00N` (cùng hoặc khác cluster) → `tago migrate shards --shard s00N` → mở nhận workspace mới |
| Thay máy / mở rộng | Thêm node Patroni làm standby → switchover → gỡ máy cũ |
| Kiểm tra wraparound | Cảnh báo khi `age(datfrozenxid)` > 1 tỷ; job `VACUUM (FREEZE)` ngoài giờ cao điểm |

### 13.4 Gói "DB riêng" trên máy vật lý

| Mức | Bố trí | Dùng khi |
|---|---|---|
| Dedicated DB | DB `tago_d_<khách>` riêng **trên cluster dùng chung** | Khách cần tách dữ liệu, backup / xoá riêng; chi phí thấp |
| Dedicated cluster | Cụm Patroni riêng (máy riêng) cho khách | Khách cần tách tài nguyên, hiệu năng cam kết, hoặc đặt máy tại DC của khách |

Cả hai đều là một dòng `data_shards(kind=dedicated)`; chuyển khách vào hay ra bằng công cụ mục 9.

## 14. Đường mở rộng về sau (không phải viết lại)

1. **Thêm shard / cluster**: chỉ thêm dòng `data_shards`, chạy migration, mở nhận workspace mới.
2. **Chọn vùng dữ liệu** (giống Lark): cluster theo `region`, DB `tago` có thể tách theo vùng hoặc giữ toàn cục (như Linear [F]).
3. **Citus row-based**: vì `workspace_id` đứng đầu mọi khoá, có thể phân tán bảng theo `workspace_id` gần như không đổi code [F] Citus.
4. **Bảng rất lớn / phân tích**: CDC → ClickHouse / Parquet theo `(workspace_id, table_id)` cho dashboard và pivot (bài học monday / Airtable [F]).

## 15. Thay đổi so với `docs/backend-go-design.md`

| Mục | Sau khi áp thiết kế này |
|---|---|
| §1.1 | DB `tago` + shard data dùng chung; DB riêng là gói |
| §3 | `migrations/system`, `migrations/data`; `internal/clients/db` có `System` + `shards.Router` |
| §4 | Giữ `workspace_id` ở mọi bảng tenant, **đứng đầu khoá chính**; tài khoản / workspace / thành viên chuyển sang DB `tago` |
| §6 | Luôn có `workspace_id = $ws` (+ RLS dự phòng) |
| §8 | Outbox mỗi shard; transaction ghi kiểm tra `workspace_epochs` |
| §15 | `tago migrate system` / `tago migrate shards` |

## 16. Lộ trình

| Giai đoạn | Việc |
|---|---|
| 0 | Hạ tầng: cụm Patroni 2 DB + witness, PgBouncer, pgBackRest 2 repo + diễn tập khôi phục, giám sát (mục 13) |
| 1 | DB `tago` (users, sessions, workspaces, members, invitations, data_shards, workspace_placements, keys); `shards.Router` + `TenantResolver` + `tenant.Tx` (SET LOCAL, epoch); 1 shard `s001`; RLS; test cách ly |
| 2 | Bảng Apps trong shard với khoá `(workspace_id, …)`; `member_profiles` + đồng bộ sự kiện; `public_routes` |
| 3 | Outbox mỗi shard; hàng đợi mang `workspace_id`; `schedules`; phân vùng bảng log |
| 4 | Công cụ chuyển workspace (mục 9) + kiểm thử chuyển qua lại tự động; khôi phục 1 workspace; xoá workspace |
| 5 | Gói "DB riêng": tạo shard dedicated + chuyển khách; chọn vùng dữ liệu nếu cần |

## 17. Cần chốt

1. **Đồng ý mô hình hybrid** (mặc định dùng chung shard, DB riêng là gói), hay vẫn muốn **mọi** workspace có DB riêng?
   - Nếu vẫn muốn mọi workspace có DB riêng: giữ nguyên các quy tắc I1–I10 (nhất là `workspace_id` trong mọi bảng), để sau này còn đường gộp lại khi số workspace lên hàng nghìn.
2. Dự kiến số workspace sau 1–2 năm (hàng trăm, hàng nghìn hay hàng chục nghìn), và tỉ lệ khách miễn phí?
3. Có khách nào đã yêu cầu dữ liệu nằm riêng / chọn vùng (ngân hàng, bệnh viện, cơ quan nhà nước) chưa?
4. ~~Hạ tầng Postgres~~ — đã chốt: server vật lý, tự vận hành (mục 13). Còn cần biết: số máy hiện có, có DC thứ hai để đặt bản backup off-site không?
