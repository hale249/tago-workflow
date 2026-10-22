# Các dự án mã nguồn mở dạng Active Table được thiết kế thế nào

Nghiên cứu ngày 2026-10-22 bằng cách **đọc mã nguồn thật** (`git clone --depth 1`, chỉ đọc) của 6 dự án: Baserow, NocoBase, Teable, Grist, NocoDB, APITable. Mỗi phần bên dưới có đường dẫn file trong repo của dự án đó để kiểm tra lại. Danh sách và giấy phép: xem `docs/opensource-active-tables.md`. NocoDB (Sustainable Use License) và các phần premium/enterprise của Baserow chỉ để học thiết kế, không lấy code.

## 1. So sánh nhanh

| | Baserow | NocoBase | Teable | Grist | NocoDB | APITable |
|---|---|---|---|---|---|---|
| Stack backend | Django + DRF + Celery, Postgres, Redis | Koa + Sequelize, PG/MySQL/SQLite | NestJS + Prisma (meta) + knex (data), Postgres | Node (TS) + engine Python trong sandbox | NestJS + Knex, nhiều dialect | Java/Spring (workbench) + NestJS room-server, MySQL, Redis, RabbitMQ |
| **Lưu bản ghi** | Bảng SQL thật `database_table_<id>`, cột `field_<id>` | Bảng SQL thật, cột thật (tên `t_…`/`f_…`) | Bảng Postgres thật trong schema theo base, cột theo `db_field_name` | **Mỗi tài liệu = 1 file SQLite**, bảng + cột thật | Bảng SQL thật (có thể là DB có sẵn của khách) | **JSON**: `datasheet_record.data` = `{fieldId: value}` |
| Lưu cấu hình bảng/trường/view | Bảng meta chuẩn hoá (đa hình theo loại field/view) | Bảng `collections`/`fields` + JSON `options` | Bảng meta (Prisma); filter/sort/group/columnMeta là JSON | Bảng meta `_grist_*` ngay trong file SQLite | Bảng meta `nc_*` + bảng option riêng cho từng loại cột | **Một JSON** `datasheet_meta.meta_data` (fieldMap + views) |
| Đổi cấu trúc khi thêm/sửa trường | DDL lúc chạy (lenient cast khi đổi kiểu) | Sequelize sync kiểu alter, không drop | DDL qua knex, có hàng đợi schema operation | DDL trên SQLite của tài liệu | DDL theo dialect (rất nhiều mã đặc thù) | Chỉ sửa JSON, không có DDL |
| Liên kết bản ghi | Bảng trung gian `database_relation_<id>` dùng chung 2 chiều | belongsTo/hasMany/belongsToMany + bảng through tự tạo | FK hoặc bảng trung gian tuỳ quan hệ + cột jsonb cache `{id,title}` | Cột `Ref`/`RefList` (id hàng), cột đối xứng `reverseCol` | Links v2: mọi quan hệ dùng bảng trung gian | Mảng recordId lưu ở **cả hai** bảng, code tự giữ nhất quán |
| Công thức / lookup / rollup | Biên dịch sang SQL, **lưu sẵn vào cột**, tính lại theo đồ thị phụ thuộc | Tính ở `beforeSave` rồi lưu vào cột (math.js/formula.js) | ANTLR → SQL; generated column hoặc lưu cột, tính lại theo lớp topo bằng CTE | **Python**, tự ghi phụ thuộc khi chạy, tính lại tăng dần | **Tính lúc truy vấn** bằng subquery (không lưu) | Tính lúc đọc trong JS (cả client và server), không lưu |
| Lọc/sắp xếp | Bộ lọc → `Q` Django (60+ loại) | JSON `{$and:[…]}` → Sequelize where | Cây filter JSON → SQL theo adapter từng kiểu giá trị | Ở client, theo metadata section | Cây filter (bảng `nc_filter_exp`) → Knex | **Trong bộ nhớ** (JS), worker thread khi phức tạp |
| Realtime | Django Channels + Redis, broadcast sau commit, có replay khi kết nối lại | Đồng bộ cluster qua sync message | ShareDB (OT json0) + Redis, chỉ publish op sau commit | WebSocket, **một tiến trình ghi mỗi tài liệu** (mutex), không cần OT | Chỉ là stub trong bản CE | OT changeset có revision, Redis lock theo bảng |
| Undo/redo | Bảng `Action` có do/undo/redo, theo session | — | Lệnh đảo ngược được, stack trong cache theo user/bảng/cửa sổ | Mỗi DocAction có undo, lịch sử dạng chuỗi hash | Chỉ là stub trong bản CE | `jot.invert` phía client, stack 50 lệnh |
| Phân quyền | Chuỗi permission manager; RBAC ở enterprise | ACL ghép filter + fields vào truy vấn (data scope) | 5 vai trò → action `resource\|verb`, gán ở space/base | Luật theo bảng/cột/hàng bằng công thức điều kiện, lọc cả dữ liệu realtime | Ma trận role → tên handler (`@Acl`) | Cây node có kế thừa + quyền theo trường (bitmask) |
| Mở rộng | Registry cho mọi thứ (field, view, filter…), plugin Django | Plugin là trung tâm (~150 plugin) | Plugin chạy trong iframe | Widget tuỳ chỉnh (iframe) | Plugin lưu trữ file | Widget SDK |

## 2. Ba trường phái lưu dữ liệu

1. **Bảng SQL thật, mỗi trường một cột** — Baserow, NocoBase, Teable, NocoDB.
   - (+) Lọc, sắp xếp, index, tổng hợp, BI chạy thẳng trên DB; dữ liệu có kiểu rõ ràng.
   - (−) Phải chạy DDL lúc chạy (khoá bảng, đổi kiểu cần chuyển dữ liệu), DB phình ra hàng nghìn bảng khi làm SaaS nhiều tenant; code đổi kiểu rất phức tạp (NocoDB ~10k dòng).
2. **JSON theo bản ghi + cấu hình JSON** — APITable.
   - (+) Đổi cấu trúc gần như miễn phí, một engine dùng chung client/server, changeset làm được realtime + lịch sử + undo.
   - (−) Lọc/sắp xếp làm trong bộ nhớ nên phải tải cả bảng; giới hạn số bản ghi; thứ tự dòng của view nằm trong JSON meta nên ghi đè meta liên tục.
3. **Một file DB cho mỗi tài liệu + engine riêng** — Grist.
   - (+) Cô lập tenant tự nhiên, backup/fork chỉ là copy file, công thức Python rất mạnh, luật phân quyền chi tiết.
   - (−) Cả tài liệu nằm trong RAM, không truy vấn chéo tài liệu, mỗi tài liệu một sandbox.

## 3. Gợi ý cho backend Tago

Đối chiếu với API của beqeek (`docs/beqeek-api-2026-10-22.md`): beqeek lưu **bản ghi dạng JSON theo mã trường** (`record: { ma_don_hang: …, khach_hang: <id> }`), **cấu hình bảng là một JSON** (`config.fields`, `kanbanConfigs`, `ganttCharts`, `calendarConfigs`…) và lọc/phân trang phía server (`filtering`, `paging: cursor`). Mô hình frontend hiện tại của Tago (`apps/admin/src/features/tables/types/table.ts`) cũng theo hướng này. Hướng phù hợp:

1. **Postgres + JSONB cho bản ghi**, cấu hình bảng là JSON có `version` — giống beqeek và APITable, đổi cấu trúc không cần DDL.
2. **Nhưng lọc/sắp xếp/phân trang chạy trong DB**, không làm trong bộ nhớ như APITable: dịch cây bộ lọc (kiểu `nc_filter_exp` của NocoDB / `filterSet` của Teable) sang SQL trên JSONB; thêm expression index hoặc generated column cho các trường hay lọc; phân trang bằng cursor.
3. **Trường tính toán (Số tự tính, lookup, rollup) lưu sẵn kết quả** và tính lại theo đồ thị phụ thuộc giữa các trường (như Baserow `FieldDependency` / Teable `reference`), để lọc và sắp xếp được.
4. **Một đường ghi duy nhất**: command → thay đổi theo ô `(recordId, fieldId)` → changeset có revision, dùng chung cho UI, REST, workflow, lịch sử, undo và realtime (ý tưởng từ APITable/Grist/Teable). Phát sự kiện realtime **sau khi commit**, kèm id phiên để không gửi lại cho người vừa sửa (Baserow).
5. **Thứ tự dòng thủ công** dùng số thập phân/fractional index trên bản ghi (Baserow `order`, NocoDB `nc_order`), không lưu danh sách dòng trong view.
6. **Kiểu trường đăng ký theo registry** cả backend lẫn frontend (Baserow, NocoBase): mỗi loại trường khai báo kiểu lưu, validate, toán tử lọc, cách hiển thị.
7. **Phân quyền** ghép điều kiện vào truy vấn (data scope kiểu NocoBase), cộng quyền theo trường; server luôn kiểm tra lại.
8. **Undo/redo** dạng lệnh đảo ngược được, lưu theo người dùng + bảng (Teable/Baserow) — đơn giản hơn OT đầy đủ.
9. Nếu sau này cần bảng rất lớn hoặc BI nặng, có thể chuyển một số bảng sang "bảng SQL thật" theo cách Baserow/Teable (đặt tên theo id, tách metadata DB và data DB).

---
## Baserow

> Nguồn: `git clone --depth 1 https://github.com/baserow/baserow` (bản clone ngày 2026-10-22). Mọi đường dẫn bên dưới tính từ root repo. Backend Python nằm dưới `backend/src/baserow/`, ở dưới viết tắt là `B/`.

### 1. Kiến trúc tổng thể
- **Stack**: Django + DRF + Celery + PostgreSQL + Redis (backend), Vue 3 / Nuxt 4 / Vuex (frontend), xem `AGENTS.md` ("Technology Stack"). Realtime dùng Django Channels qua Redis (`CHANNEL_LAYERS` → `channels_redis.core.RedisChannelLayer`, `B/config/settings/base.py`).
- **Service** (`docker-compose.yml`): `caddy` (reverse proxy), `backend` (gunicorn/ASGI, phục vụ cả REST lẫn WS), `web-frontend` (Nuxt SSR), `celery`, `celery-export-worker`, `celery-beat-worker`, `email-receiver`, `db` (Postgres), `redis`.
- **Monorepo**: `backend/` (core, bản quyền MIT), `web-frontend/`, cùng `premium/{backend,web-frontend}` và `enterprise/{backend,web-frontend}` có cấu trúc y hệt core nhưng theo license riêng (`LICENSE`). Ngoài ra có `formula/` (grammar ANTLR), `e2e-tests/`, `deploy/` và `docs/`.
- **Django app** trong `B/contrib/`: `database` (Active Tables), `builder` (Application Builder), `automation`, `dashboard`, `integrations`, `agent`. Premium bổ sung `baserow_premium` (Kanban, Calendar, Timeline, AI field, row comments, license). Enterprise bổ sung `baserow_enterprise` (RBAC role, SSO, audit log, field permissions, teams, data sync).
- **Phân lớp** (theo skill `manage-backend-layers`): model → `handler.py` (logic thuần) → `service.py` (kiểm quyền) → `actions.py` (undoable action) → `api/` (DRF view và serializer). Ví dụ: `B/contrib/database/fields/{handler,actions}.py`.

### 2. Metadata model (các bảng meta)
- `Workspace` và `WorkspaceUser.permissions` (`"ADMIN"`/`"MEMBER"`) nằm ở `B/core/models.py`. `Application` (FK `workspace`, `name`, `order`, `content_type`) là gốc đa hình, và `Database(Application)` kế thừa từ nó (`B/contrib/database/models.py`).
- `Table` (`B/contrib/database/table/models.py`) gồm `database`, `name`, `order`, `version` (dùng để invalidate cache model) và các cờ migrate lazy `created_by_column_added`, `last_modified_by_column_added`, `missing_m2m_indexes_added`... Thống kê nằm ở `TableUsage.row_count`.
- `Field` (`B/contrib/database/fields/models.py`) gồm `table`, `name`, `order`, `primary`, `content_type`, `description`, `read_only`, `db_index`, `field_dependencies` (M2M qua `FieldDependency`). Field dùng **Django multi-table inheritance + `PolymorphicContentTypeMixin`**: mỗi loại có bảng con riêng chứa cấu hình, ví dụ `NumberField.number_decimal_places`, `LinkRowField.link_row_table/link_row_related_field/link_row_relation_id`, `FormulaField.formula/internal_formula/formula_type/error`. Lựa chọn của select nằm ở `SelectOption(value,color,order,field)`.
- `View` (`B/contrib/database/views/models.py`) gồm `table`, `name`, `order`, `content_type`, `filter_type` (AND/OR), `filters_disabled`, `public`, `slug`, `public_view_password`, `owned_by`, `ownership_type`. Các bảng con: `GridView`, `GalleryView`, `FormView`, cùng premium `KanbanView.single_select_field`, `CalendarView.date_field`, `TimelineView.start_date_field/end_date_field` (`premium/backend/src/baserow_premium/views/models.py`).

### 3. Lưu trữ vật lý dữ liệu người dùng
- **Mỗi user table là một bảng SQL thật**, mỗi field là một cột thật: `USER_TABLE_DATABASE_NAME_PREFIX = "database_table_"` (`B/contrib/database/table/constants.py`), `Table.get_database_table_name()` trả về `database_table_<id>`, và `Field.db_column` trả về `field_<id>`. Đặt tên theo id nên đổi tên field không cần chạy DDL.
- Bảng junction có các prefix: `database_relation_<link_row_relation_id>` (link row), `database_multipleselect_<id>`, `database_multiplecollaborators_<id>` (`table/constants.py`, `LinkRowField.through_table_name`).
- **Model Django được sinh động lúc runtime**: `Table.get_model()` gọi `type("Table{id}Model", (GeneratedTableModel, TrashableModelMixin, CreatedAndUpdatedOnMixin, models.Model), attrs)` với `managed=False` và `app_label` dạng uuid để đảm bảo thread-safe (`table/models.py`). Các attr của field được cache theo `table.version` (`table/cache.py: get_cached_model_field_attrs`). Cột hệ thống: `id`, `order` (`DecimalField(40,20)`, sắp xếp phân số khi kéo-thả hàng), `trashed`, `created_on`/`updated_on`, `created_by`, `last_modified_by`.
- **Schema change là DDL chạy lúc runtime**, không dùng Django migration. `TableHandler` gọi `schema_editor.create_model(model)` (`table/handler.py`). `FieldHandler.create_field` gọi `schema_editor.add_field`, còn `update_field` dùng `lenient_schema_editor(...).alter_field(...)` (`fields/handler.py`). `lenient_schema_editor` (`B/contrib/database/db/schema.py`) tạo SQL function cast "try-convert, lỗi thì NULL" để đổi kiểu không bao giờ fail, dựa trên `FieldType.get_alter_column_prepare_old_value/new_value`. Với chuyển đổi phức tạp (sang/từ link row, formula, file, multiple select...) hệ thống dùng `FieldConverter` qua `field_converter_registry` (`apps.py`: `LinkRowFieldConverter`, `FormulaFieldConverter`...). Mọi thao tác đều đi qua `safe_django_schema_editor`, bản vá lỗi atomic của Django và xử lý m2m tự tham chiếu.
- **Locking**: `FieldHandler.get_specific_field_for_update` thực hiện `select_for_update(of=("self","table"), nowait=settings.BASEROW_NOWAIT_FOR_LOCKS)`. Cập nhật row dùng `select_for_update(of=("self",))` (`rows/handler.py`).
- **Xoá field/table là soft-delete** (trash): cột vẫn còn trong DB, attr của model được đổi thành `trashed_field_<id>`. Đến khi xoá vĩnh viễn, `FieldTrashableItemType.permanently_delete_item` mới gọi `schema_editor.remove_field`, còn table thì gọi `delete_model` (`B/contrib/database/trash/trash_types.py`).
- **Search**: kiểu mới dùng bảng riêng cho mỗi workspace `database_search_workspace_<id>_data` (tsvector theo `(row_id, field_id)`) cộng hàng đợi `PendingSearchValueUpdate`. Kiểu cũ (legacy) dùng cột `tsv_field_<id>` (`B/contrib/database/search/{handler,models}.py`).

### 4. Hệ thống field type
- **Registry pattern** là xương sống của toàn bộ codebase: `Instance` và `Registry` ở `B/core/registry.py`. `FieldType(... Instance)` cùng `field_type_registry` nằm ở `fields/registries.py`, đăng ký trong `B/contrib/database/apps.py` (`field_type_registry.register(TextFieldType())`, ..., `LinkRowFieldType`, `FormulaFieldType`, `CountFieldType`, `RollupFieldType`, `LookupFieldType`, `AutonumberFieldType`, `ButtonFieldType`...). Premium đăng ký `AIFieldType`.
- Mỗi `FieldType` khai báo `type`, `model_class` (bảng cấu hình), `allowed_fields` và `serializer_field_names`, rồi implement các method sau: `get_model_field()` (cột Django/Postgres), `get_serializer_field()` / `get_response_serializer_field()` (validate và serialize giá trị cell), `prepare_value_for_db`, `get_alter_column_prepare_*`, `contains_query`/`empty_query` (filter), `get_order`/`check_can_order_by`/`check_can_group_by` (sort, group), `enhance_queryset` (prefetch), `to_baserow_formula_type` (tương tác với formula), `get_field_dependencies`, `row_of_dependency_updated`, `export_serialized`/`import_serialized`, `random_value`... (`fields/registries.py`, `fields/field_types.py`). Frontend có registry tương ứng: `web-frontend/modules/database/fieldTypes.js` (`class FieldType extends Registerable` với `getGridViewFieldComponent`, `getRowEditFieldComponent`, `getSort`...), đăng ký trong `web-frontend/modules/database/plugin.js`.
- **Link row**: dùng `models.ManyToManyField(to=related_model, db_table=instance.through_table_name, db_constraint=False, related_name=...)` gắn vào model sinh động (`LinkRowFieldType`, `fields/field_types.py`). Hai chiều của quan hệ là 2 bản ghi `LinkRowField` trỏ nhau qua `link_row_related_field` nhưng **dùng chung một bảng junction** `database_relation_<relation_id>`. Quan hệ một chiều (`has_related_field=False`) và quan hệ tự tham chiếu đều được hỗ trợ. `link_row_multiple_relationships` dùng để giới hạn 1-n.
- **Lookup/Rollup/Count**: là subclass của `FormulaField`/`FormulaFieldType` (`CountField.through_field`, `RollupField.through_field/target_field/rollup_function`, `LookupField...`), tức là được biên dịch thành formula nội bộ.
- **Formula engine**: grammar ANTLR `formula/BaserowFormula.g4` sinh parser cho cả Python và JS (`formula/README.md`). Pipeline: parse → AST (`formula/ast/tree.py`, các hàm trong `ast/function_defs.py`) → type-check (`formula/types/typer.py: calculate_typed_expression`, `formula_types.py`) → sinh **Django expression / SQL** (`formula/expression_generator/generator.py: BaserowExpressionToDjangoExpressionGenerator`). Lookup qua link được biên dịch thành subquery hoặc join trên bảng junction. **Giá trị formula được materialize vào cột `field_<id>` thật**: khi dependency thay đổi, hệ thống chạy `UPDATE ... SET field_x = <expr>` (`FormulaFieldType._update_field_values` → `FormulaHandler.baserow_expression_to_update_django_expression`). Nhờ đó filter, sort và search trên formula rẻ như trên cột thường.
- **Dependency graph**: bảng `FieldDependency(dependant, dependency, via)` (`fields/dependencies/models.py`), cùng `FieldDependencyHandler` (`group_all_dependent_fields_by_level`, `circular_reference_checker.py`). `FieldUpdateCollector` (`fields/dependencies/update_collector.py`) gom các UPDATE theo từng tầng, có thể giới hạn `starting_row_ids` (chỉ cập nhật các hàng join ngược về hàng gốc), chạy lan sang các bảng liên kết, rồi gửi signal `field_updated` và `rows_updated` cho realtime. Formula phụ thuộc thời gian (`needs_periodic_update`, ví dụ `today()`) được làm mới bởi `periodic_field_update_handler.py` qua Celery task `run_periodic_fields_updates` (`fields/tasks.py`).

### 5. Views
- `view_type_registry` có `GridViewType`, `GalleryViewType`, `FormViewType` (core), cộng `KanbanViewType`, `CalendarViewType`, `TimelineViewType` (premium). Base class là `ViewType` (`views/registries.py`).
- **Cấu hình** nằm trong các bảng chuẩn hoá: `ViewFilter(view, field, type, value TEXT, group)`, `ViewFilterGroup(filter_type, parent_group)` cho filter lồng nhau AND/OR, `ViewSort(view, field, order, type)`, `ViewGroupBy`, `ViewDecoration` (tô màu), `ViewDefaultValue`. **Field options** là bảng riêng cho từng loại view: `GridViewFieldOptions(width, hidden, order, aggregation_type, aggregation_raw_type)`, `GalleryViewFieldOptions`, `FormViewFieldOptions` (required, conditions qua `FormViewFieldOptionsCondition(Group)`), `KanbanViewFieldOptions`... (`views/models.py`).
- **Filter → SQL**: mỗi `ViewFilterType.get_filter(field_name, value, model_field, field)` trả về một `Q` hoặc `AnnotatedQ` (`views/registries.py`). Hơn 60 loại filter được đăng ký (`EqualViewFilterType`, `ContainsViewFilterType`, `DateIsWithinMultiStepFilterType`, `LinkRowHasViewFilterType`...), cài đặt trong `views/view_filters.py`. Chúng được ghép thành cây bằng `AdvancedFilterBuilder`/`FilterBuilder` (`fields/field_filters.py`) và áp lên queryset trong `ViewHandler.apply_filters` (`views/handler.py`). API công khai cho phép truyền filter ad-hoc (`AdHocFilters`, `ADHOC_FILTERS_API_PARAMS` trong `api/rows/views.py`).
- **Pagination**: `GET /api/database/rows/table/<id>/` dùng `PageNumberPagination` (`page`, `size`, giới hạn bởi `ROW_PAGE_SIZE_LIMIT`). Grid view hỗ trợ cả kiểu limit/offset lẫn page/size (`api/views/grid/views.py`), có endpoint cho aggregations và `group-by-data`.
- `ViewRows.row_ids` (ArrayField) chụp snapshot các hàng đang thuộc view để webhook phát hiện sự kiện "row enter/exit view".

### 6. API, auth, CRUD, undo/redo, trash
- **REST**: các route dạng `/api/database/{tables,fields,views,rows}/...`. Row: `rows/table/<table_id>/` (list/create), `.../<row_id>/` (get/patch/delete), `.../batch/` (batch create/update), `.../batch-delete/`, `.../<row_id>/move/`, `.../<row_id>/history/`, `.../adjacent/` (`B/contrib/database/api/rows/urls.py`). `?user_field_names=true` cho phép dùng tên field thay cho `field_<id>`, và `include`/`exclude`/`{link}__join=` hỗ trợ chọn trường. Batch tối đa `BATCH_ROWS_SIZE_LIMIT=200` (`settings/base.py`). Có OpenAPI tự sinh (`baserow.api.openapi.AutoSchema`).
- **Auth**: JWT (`baserow.api.authentication.JSONWebTokenAuthentication`, access token sống 10 phút, refresh 7 ngày), và **Database Token** cho tích hợp: `Token(key, user, workspace, handled_calls)` + `TokenPermission(type ∈ create/read/update/delete, database|table)` (`B/contrib/database/tokens/models.py`), xác thực bằng header `Authorization: Token <key>` (`api/tokens/authentications.py`). Enterprise thêm SSO (`baserow_enterprise/sso/{saml,oauth2}`).
- **Row CRUD** qua `RowHandler.create_rows/update_rows/delete_rows/move_row` (`rows/handler.py`). Luồng: validate bằng serializer sinh động từ field type → bulk insert/update → `FieldUpdateCollector` tính lại formula phụ thuộc → signal → WS broadcast và webhook. `RowHistory` (`rows/models.py`) lưu diff theo từng hàng.
- **Undo/redo**: bảng `Action(user, workspace, session, type, params JSON, scope, undone_at, action_group)` (`B/core/action/models.py`). Mỗi thao tác là một `UndoableActionType` có `do/undo/redo` (`B/core/action/registries.py`), được lọc theo `ActionScope` (workspace/table/view) và theo session client lấy từ header `ClientSessionId` và `ClientUndoRedoActionGroupId` (`B/api/sessions.py`). Endpoint undo/redo chạy `ActionHandler`.
- **Trash**: `TrashEntry(trash_item_type, trash_item_id, parent_trash_item_id, workspace, application, user_who_trashed, should_be_permanently_deleted, trashed_at)` (`B/core/models.py`). Mỗi loại đối tượng có một `TrashableItemType` (`trash/trash_types.py`). Xoá vĩnh viễn sau `HOURS_UNTIL_TRASH_PERMANENTLY_DELETED` (mặc định 72h) bằng Celery.

### 7. Realtime
- Một websocket duy nhất `ws/core/` (`B/ws/routing.py` → `CoreConsumer`, `B/ws/consumers.py`), xác thực bằng `?jwt_token=` trong query string (`B/ws/auth.py`). Client gửi `{"page": "table", "table_id": X}` để subscribe một "page" (`PageType`: `TablePageType`, `PublicViewPageType`, `RowPageType` trong `B/contrib/database/ws/pages.py`). Mỗi page tương ứng một channel group trên Redis, kèm group theo permission để có thể cắt quyền theo thời gian thực.
- Signal (`rows_created`, `rows_updated`, `field_updated`...) được receiver trong `B/contrib/database/ws/*/signals.py` bắt và gọi `transaction.on_commit(lambda: table_page_type.broadcast(payload, ignore_web_socket_id=..., table_id=...))`. `broadcast` đẩy việc sang Celery task `broadcast_to_channel_group` (`B/ws/registries.py`, `ws/tasks.py`). `ignore_web_socket_id` giúp người gây ra thay đổi không nhận lại event của chính mình.
- Các bổ sung mới: lưu event vào `RealtimeEvent` (`ws_realtime_events`) và `RealtimeEventHistorySummary` để **replay khi client reconnect** (`ws/realtime_events.py`, `ws/replay.py`, có tham số `BASEROW_REALTIME_REPLAY_MAX_EVENTS`), cùng presence/focus (`ws/presence.py`, `contrib/database/ws/presence_focus_types.py`).

### 8. Permissions
- Chuỗi `PERMISSION_MANAGERS` (`settings/base.py`): `core`, `staff`, `member`, `token`, `basic`, `view_ownership` (premium), `role` và `write_field_values` (enterprise)... Mỗi manager là một `PermissionManagerType` với `check_multiple_permissions`, `get_permissions_object` (trả về cho frontend) và `filter_queryset` (`B/core/registries.py`). Manager đầu tiên trả lời True/False thì quyết định luôn.
- Quyền được mô tả bằng **operation** (vd `CreateRowDatabaseTableOperationType` trong `*/operations.py`) trên **object scope** (`object_scopes.py`: workspace → application → table → field/view/row).
- Core có 2 vai trò `ADMIN` và `MEMBER` (`WorkspaceUser.permissions`). Enterprise có RBAC gồm `Role(uid, operations M2M)` và `RoleAssignment(subject_type/subject_id → user|team, role, workspace, scope_type/scope_id)` (`enterprise/backend/src/baserow_enterprise/role/models.py`), với các role mặc định ADMIN/BUILDER/EDITOR/COMMENTER/VIEWER/NO_ACCESS (`role/default_roles.py`) gán được ở cấp workspace, database hoặc table. Có thêm field-level permissions (`baserow_enterprise/field_permissions/`) và view ownership (personal/collaborative).

### 9. Automation, webhook, builder, AI
- **Webhook**: `TableWebhook(url, request_method, use_user_field_names, include_all_events, failed_triggers)`, `TableWebhookEvent(event_type, fields M2M, views M2M)`, `TableWebhookHeader`, `TableWebhookCall` (log). Gửi bằng Celery `call_webhook` với retry backoff `2**retries` và tự vô hiệu hoá sau nhiều lần lỗi (`B/contrib/database/webhooks/{models,tasks}.py`).
- **Automation** (`B/contrib/automation/`): workflow là đồ thị node, `node_types.py` gồm trigger (`rows_created/updated/deleted`, `periodic`, `http_trigger`, `email_trigger`, `manual`) và action (`create_row`, `update_row`, `list_rows`, `http_request`, `iterator`, `router`, `smtp_email`, `ai_agent`, `slack_write_message`). Các action tái dùng `ServiceType` từ `contrib/integrations` (`local_baserow/service_types.py`).
- **Application Builder** (`B/contrib/builder/`): pages, elements, data_sources, workflow_actions, domains, theme. Dữ liệu được bind vào bảng qua cùng các `LocalBaserow*ServiceType`.
- **AI field** (premium): `AIFieldType` (`type="ai"`) có `ai_prompt` (formula), `ai_output_type`, `ai_auto_update`. Việc sinh giá trị chạy bằng Celery task trên queue `export` (`baserow_premium/fields/{field_types,models,tasks}.py`). Provider được cấu hình trong `B/core/generative_ai/` (OpenAI, Anthropic, Bedrock...). Ngoài ra còn có MCP server (`B/config/asgi.py` `^mcp`, `contrib/database/mcp`).

### 10. Extensibility / plugin
- Mọi thứ đều là registry: field type, view type, filter, aggregation, decorator, formula function, application type, permission manager, trash type, action type, webhook event, page type... Plugin chỉ cần đăng ký một instance mới vào registry trong `AppConfig.ready()`.
- `Plugin(APIUrlsInstanceMixin, Instance)` có `get_urls`/`get_api_urls`, các hook `user_created`, `user_signed_in`... (`B/core/registries.py`). Premium và enterprise thực chất cũng là plugin (`baserow_premium/plugins.py: PremiumPlugin`). Plugin bên thứ ba được nạp qua `BASEROW_BACKEND_PLUGIN_NAMES` vào `INSTALLED_APPS` (`settings/base.py`), và có tài liệu hướng dẫn ở `docs/plugins/` (field-type, view-type, view-filter-type, field-converter, boilerplate).

### 11. Bài học thiết kế cho "Active Tables"
**Nên copy:**
1. **Registry + polymorphic type** cho field, view và filter, có cặp registry tương ứng ở frontend. Thêm một loại field chỉ cần viết một class mà không phải sửa core.
2. Đặt tên vật lý theo **id** (`database_table_<id>`, `field_<id>`). Nhờ vậy đổi tên chỉ là cập nhật metadata, và có thể đổi qua lại giữa `user_field_names` và `field_<id>` trong API.
3. **Lưu metadata của view thành bảng chuẩn hoá** (filter, filter group lồng nhau, sort, group-by, field options riêng từng loại view) thay cho một blob JSON. Cách này dễ validate, dễ cascade khi xoá field, và dễ đồng bộ realtime theo từng thay đổi nhỏ.
4. **Materialize formula/lookup/rollup** vào cột thật và tính lại theo dependency graph (`FieldDependency` + update collector theo tầng, giới hạn theo `starting_row_ids`), nhờ đó đọc, filter và sort đều nhanh.
5. **Soft-delete trước** (trash với TTL) kết hợp undo/redo dạng action log có `do/undo/redo` và scope theo session.
6. Broadcast trong `on_commit` qua hàng đợi, kèm `ignore_web_socket_id`. Subscribe theo "page" và tách group theo quyền.
7. `order` kiểu decimal phân số để kéo-thả hàng mà không phải đánh lại số cho toàn bảng (chỉ `recalculate_row_orders` khi cạn khe).

**Pitfall cần lường trước:**
- Mô hình **mỗi table một bảng thật** dẫn tới hàng chục nghìn bảng trong Postgres, gây nặng cho catalog, `pg_dump`, autovacuum và connection cache. `ALTER COLUMN TYPE` sẽ rewrite cả bảng và giữ `ACCESS EXCLUSIVE` lock. Baserow phải tự viết `lenient_schema_editor`, cache model theo `version`, `select_for_update(nowait)` và lazy-migrate cột hệ thống bằng các cờ `*_column_added` trên `Table`. Nếu muốn đơn giản hơn, cân nhắc JSONB/EAV hoặc mô hình lai.
- Model Django sinh động thì phức tạp: `app_label` dạng uuid, vá lỗi `creation_counter`, m2m tự tham chiếu (xem `safe_django_schema_editor`). ORM không sinh động sẽ đơn giản hơn nhiều.
- Lan truyền formula xuyên bảng có thể kích hoạt `UPDATE` hàng loạt. Cần chống vòng tham chiếu (`circular_reference_checker.py`), giới hạn độ sâu và kích thước formula (`MaximumFormulaSizeError`).
- Full-text search theo cột tsv cho từng field không scale được, nên Baserow đã chuyển sang bảng search riêng cho mỗi workspace cộng hàng đợi pending. Nên thiết kế search tách khỏi bảng dữ liệu ngay từ đầu.
- Ranh giới license: nhiều tính năng (Kanban, Calendar, Timeline, AI, RBAC, audit log) nằm trong `premium/` và `enterprise/`, không phải MIT, nên chỉ học ý tưởng, không copy code.


---

## NocoBase

> Nguồn: `git clone --depth 1 github.com/nocobase/nocobase` (snapshot 2026-10-22). Mọi path dưới đây tính từ root repo. Repo có `LICENSE-APACHE.txt` + `LICENSE.txt` ("NocoBase License Agreement", 2026-02-24); header từng file vẫn ghi "dual-licensed AGPL-3.0 / Commercial", nên cần kiểm tra lại license của từng plugin trước khi tái sử dụng code.

### 1. Kiến trúc tổng thể
- **Monorepo** Yarn + Lerna (`lerna.json`, `package.json`): `packages/core/*` (framework), `packages/plugins/@nocobase/plugin-*` (~150 plugin, kể cả các tính năng "lõi" như collection manager, ACL, workflow, kanban), `packages/presets`.
- **Server**: Koa 3 (`packages/core/server/package.json`, `packages/core/resourcer/package.json`). `Application` (`packages/core/server/src/application.ts`) gom `db`, `resourceManager`, `acl`, `authManager`, `pm` (PluginManager), `eventQueue`, `lockManager`, `pubSubManager`, `cronJobManager`. Middleware xếp theo toposort bằng tag/before/after (`packages/core/server/src/helper.ts`: `i18n`, `cors`, `dataWrapping`, `dataSource`, `audit`...).
- **ORM**: Sequelize 6 + Umzug cho migration (`packages/core/database/package.json`). Lớp bọc riêng: `Database`, `Collection`, `Field`, `Repository`, `RelationRepository` (`packages/core/database/src/*`).
- **Client**: React 18 + antd 5. Có **hai runtime**: *legacy* `@nocobase/client` (Formily `SchemaComponent`, UI schema JSON) và *modern* `@nocobase/client-v2` + `@nocobase/flow-engine` (FlowModel), mount dưới prefix `/v/` (`CONTEXT.md`).
- Các gói hỗ trợ: `packages/core/acl`, `auth`, `actions` (CRUD action mặc định), `data-source-manager` (đa nguồn dữ liệu), `evaluators` (math.js / formula.js / string), `ai` (LangChain).

### 2. Metadata model (collections / fields)
- Meta lưu **trong chính DB** dưới dạng system collections do `plugin-data-source-main` định nghĩa:
  - `collections` (`.../plugin-data-source-main/src/server/collections/collections.ts`): `key`, `name` (uid prefix `t_`), `title`, `inherit`, `hidden`, `options` (JSON), `description`, hasMany `fields`, belongsToMany `category` (qua `collectionCategory`).
  - `fields` (`.../collections/fields.ts`): `key`, `name` (prefix `f_`), `type` (kiểu DB/ORM), `interface` (kiểu UI), `collectionName`, `parentKey` (sub-field), `sort`, unique (`collectionName`,`name`); phần cấu hình còn lại (`uiSchema`, `target`, `foreignKey`, `through`, `expression`...) nằm trong cột JSON `options`.
- Model dùng `MagicAttributeModel` (`packages/core/database/src/magic-attribute-model.ts`): mọi thuộc tính không phải cột thật được "flatten" vào `options` JSON → schema meta không cần migrate khi thêm option mới.
- Luồng tạo bảng: REST `collections:create` → hook `collections.afterSaveWithAssociations` → `CollectionModel.migrate()` → `load()` (gọi `db.collection(options)` đăng ký Sequelize model trong bộ nhớ) → `collection.sync({ alter: { drop: false } })` (`.../plugin-data-source-main/src/server/server.ts` ~L119, `models/collection.ts`). Khi boot, `app.on('beforeStart', loadCollections)` đọc lại toàn bộ `collections`+`fields` để dựng model.
- Đồng bộ cluster: `sendSyncMessage({type:'syncCollection'})` qua `syncMessageManager` để các node khác reload.
- Collection templates (client: `packages/core/client/src/collection-manager/templates/{general,tree,sql,view}.tsx`), thêm `plugin-collection-tree`, `plugin-collection-sql`, `plugin-collection-fdw`, inheritance (PG, `inherited-collection.ts`, `inherited-sync-runner.ts`), view collection (`view-collection.ts`).

### 3. Lưu trữ vật lý
- **Một bảng SQL thật cho mỗi collection, một cột thật cho mỗi field** (không phải EAV/JSONB). `SyncRunner` (`packages/core/database/src/sync-runner.ts`) dùng `queryInterface.describeTable` rồi `addColumn`/`changeColumn`/`addConstraint`/`addIndex` — sync kiểu "alter, không drop".
- Xoá field: hook `fields.beforeDestroy` → `collection.removeFieldFromDb()` (DROP COLUMN) chạy dưới `lockManager.runExclusive` (`server.ts` ~L353). Xoá collection: `removeFromDb()` (DROP TABLE) + xoá các relation field trỏ tới nó (`models/collection.ts::remove`).
- Thay đổi `unique`/`defaultValue` có xử lý riêng: `FieldModel.syncUniqueIndex`, `syncDefaultValue` (`models/field.ts`).
- Field ảo (không có cột): `VirtualField`, `ContextField` (`packages/core/database/src/fields/`).
- **DB hỗ trợ**: `packages/core/database/src/dialects/{postgres,mysql,mariadb,sqlite}-dialect.ts` (PG hỗ trợ `schema`, đặt qua `COLLECTION_MANAGER_SCHEMA`). Nguồn ngoài (external DB, REST...) qua `data-source-manager` + `database-introspector`.

### 4. Field types & interfaces
- **Hai lớp tách biệt**:
  - *type* (server, kiểu lưu trữ): `db.registerFieldTypes({...})` (`database.ts` L710). Core có `string, text, integer/bigInt/float/double/decimal (number-field), boolean, date/datetime*/time, json, array, set, uid, uuid, nanoid, snowflakeId, password, radio, belongsTo, hasOne, hasMany, belongsToMany, context, virtual` (`packages/core/database/src/fields/`).
  - *interface* (UI, ngữ nghĩa nghiệp vụ): class kế thừa `CollectionFieldInterface` (`packages/core/client/src/data-source/collection-field-interface/CollectionFieldInterface.ts`), đăng ký bằng `dataSourceManager.addFieldInterfaces([...])` (`.../data-source/DataSourceManager.ts` L135). Ví dụ `packages/core/client/src/collection-manager/interfaces/`: `input, email, phone, select, multipleSelect, checkbox, datetime, percent, richText, m2o, o2m, o2o, m2m, linkTo, createdBy, updatedAt...`. Mỗi interface khai báo `default` (type + `uiSchema` Formily `x-component`), `availableTypes`, `properties` (form cấu hình), `filterable.operators`, `schemaInitialize()`.
- **Relation**: `M2MFieldInterface` (`interfaces/m2m.tsx`) → `type: 'belongsToMany'` + tuỳ chọn `reverseField`. `BelongsToManyField` (`fields/belongs-to-many-field.ts` L144–178) tự tạo **through collection** (`isThrough: true`) nếu chưa có, với `foreignKey`/`otherKey`. Hook `beforeCreateForReverseField` tạo field ngược; `afterCreateForForeignKeyField` tạo cột FK (`plugin-data-source-main/src/server/hooks/`). Repository riêng cho quan hệ: `relation-repository/` (`belongs-to-many-repository.ts`...).
- **Formula** (`plugin-field-formula/src/server/formula-field.ts`): `FormulaField extends Field`, **lưu giá trị vật lý** (dataType mặc định DOUBLE), tính ở hook `beforeSave`/`beforeBulkCreate` bằng `evaluators.get(engine)` (`math.js`, `formula.js`, `string` – `packages/core/evaluators/src/server/index.ts`); khi sửa expression thì `fields.afterUpdate` → tính lại toàn bảng (`initFieldData`).
- **Sequence/auto-code** (`plugin-field-sequence/src/server/fields/sequence-field.ts`): pattern ghép từ `sequencePatterns.register('string'|'integer'|'date'|'randomChar')`; bộ đếm lưu ở collection `sequences` (`.../collections/sequences.ts`); gán giá trị ở `beforeCreate`/`beforeBulkCreate`, hỗ trợ reset theo chu kỳ (cron).
- Plugin field khác: `plugin-field-sort`, `plugin-field-china-region`, `plugin-field-m2m-array` (m2m lưu dạng mảng), `plugin-snapshot-field`, `plugin-field-attachment-url`, `plugin-file-manager` (attachment là quan hệ tới `attachments`).

### 5. UI / views
- **Legacy**: page/block là cây **Formily JSON Schema** (`x-component`, `x-decorator`, `x-settings`, `x-initializer`, `x-uid`) lưu ở `uiSchemas` (`plugin-ui-schema-storage/src/server/collections/uiSchemas.ts`: `x-uid`, `name`, `schema` JSON) + **closure table** `uiSchemaTreePath` (`ancestor`, `descendant`, `depth`, ...). `UiSchemaRepository` (`.../server/repository.ts`) có `getJsonSchema`, `insertAdjacent`, `patch`, `remove`, `duplicate`. Menu/route ở `desktopRoutes` (`plugin-client/src/server`). Block initializer: `app.schemaInitializerManager.add(...)`.
- **Modern (2.0)**: mỗi block/field/action là một **FlowModel** (`packages/core/flow-engine/src/models/flowModel.tsx`) gồm `use` (class name), `props`, `stepParams` (tham số theo flow/step), `subModels` (con, `subKey`/`subType: array|object`). Lưu ở `flowModels` (`uid`, `name`, `options` JSON) + closure `flowModelTreePath` (`plugin-flow-engine/src/server/collections/`, `repository.ts`). Block: `TableBlockModel`, `DetailsBlockModel`, `FilterFormBlockModel` (`packages/core/client-v2/src/flow/models/blocks/`), `KanbanBlockModel` (`plugin-kanban/src/client-v2/models/`, có `groupField`, `dragSortBy`), `CalendarBlockModel`, `GanttBlockModel extends TableBlockModel`. Đăng ký: `this.flowEngine.registerModels({...})`.
- Block gọi dữ liệu qua `MultiRecordResource`/`SingleRecordResource` (`packages/core/flow-engine/src/resources/`) → action `list`/`get`.
- **Filter format**: JSON lồng `{ $and: [{ status: { $eq: 'open' } }, { 'author.name': { $includes: 'a' } }] }`. Operator đăng ký qua `db.registerOperators` (`packages/core/database/src/operators/`): `$eq $ne $in $notIn $includes $notIncludes $startsWith $endWith $empty $notEmpty $exists $dateOn $dateBefore $dateAfter $dateBetween $anyOf $noneOf $arrayEmpty $childIn $isTruly $isFalsy $match`... `FilterParser` (`filter-parser.ts`) dịch thành Sequelize `where` + tự sinh `include` cho path quan hệ (`author.name`). Hỗ trợ biến (`{{$user.id}}`, `{{ ctx.state.currentUser.id }}`).
- **Query params** (`packages/core/database/src/repository.ts` `CommonFindOptions`, `packages/core/actions/src/actions/list.ts`): `filter`, `fields`, `appends` (eager-load quan hệ), `except`, `sort` (`['-createdAt','id']`), `page`, `pageSize`, `paginate`, `tree`, `filterByTk`; `simplePaginate` cho bảng lớn. Parser: `options-parser.ts`.

### 6. API (resourcer/action)
- URL dạng `/api/<resource>:<action>` và lồng quan hệ `/api/<assoc>/<id>/<resource>:<action>` (`packages/core/resourcer/src/utils.ts` L93–204), ví dụ `posts:list`, `posts:create`, `posts/1/comments:list`, `collections.fields:update`.
- **Mỗi collection tự động thành resource** nhờ `collectionToResourceMiddleware` (`packages/core/data-source-manager/src/data-source.ts` L105); action mặc định `list, get, create, update, destroy, firstOrCreate, updateOrCreate, add, remove, set, toggle, move, query` (`packages/core/actions/src/actions/`, `load-default-actions.ts`).
- Pipeline mỗi data source: `auth` → `acl` (`resourceManager.use(this.acl.middleware(), { tag: 'acl', after: ['auth'] })`, `data-source.ts` L81) → `dataTemplate` → handler.
- **Auth**: `AuthManager` (`packages/core/auth/src/auth-manager.ts`) — `registerTypes(authType, {auth: Class})`, chọn authenticator qua header `authKey` (mặc định `X-Authenticator`, xem `packages/core/auth/src/__tests__/auth-manager.test.ts`); JWT + blacklist + token rotation (`packages/core/auth/src/base/jwt-service.ts`, `token-control-service.ts`). Bảng `authenticators`, `issuedTokens`, `tokenBlacklist` (`plugin-auth/src/server/collections/`); plugin thêm: `plugin-auth-sms`, `plugin-idp-oauth`, `plugin-api-keys`.

### 7. ACL
- Core: `ACL`, `ACLRole`, `ACLResource`, `AllowManager`, `FixedParamsManager`, `SnippetManager` (`packages/core/acl/src/`). `acl.can({ roles, resource, action })` trả về `params` (filter/fields) được **merge vào query** — đây là cơ chế data scope (`acl.ts` L237–331).
- Action khả dụng (`packages/core/server/src/acl/available-action.ts`): `create` (new-data), `view` (alias `get/list/query`), `update`, `destroy`; plugin bổ sung qua `dataSource.acl.setAvailableAction('export'|'importXlsx', ...)` (`plugin-action-export/src/server/index.ts` L49, `plugin-action-import/src/server/index.ts` L52); `allowConfigureFields: true` → **field-level permission**.
- Lưu trữ (`plugin-acl/src/server/collections/`): `roles` (`name`, `strategy` JSON — quyền chung cho mọi collection, vd `actions: ['view', 'update:own']`, `snippets`, `allowNewMenu`, `menuUiSchemas`), `rolesUsers`, `rolesResources` (override theo collection, `usingActionsConfig`), `rolesResourcesActions` (`name`, `fields` array, belongsTo `scope`), `rolesResourcesScopes` (`resourceName`, `scope` = filter JSON). Scope `own` có sẵn = `{ createdById: '{{ ctx.state.currentUser.id }}' }` (`acl-available-strategy.ts` L28).
- Allow công khai/đăng nhập: `acl.allow('res','action','loggedIn'|'public')`; snippet cho quyền UI/cấu hình (`acl.registerSnippet`). Quyền button UI: `uiButtonSchemasRoles`.

### 8. Workflow
- `plugin-workflow/src/server/Plugin.ts`: `registerTrigger(type, Class)` (core: `collection`, `schedule`) và `registerInstruction(type, Class)` (core: `calculation, condition, multi-conditions, end, output, create, update, destroy, query`). Plugin con thêm node: `-loop, -parallel, -delay, -request, -sql, -manual` (human task), `-mailer, -notification, -javascript, -aggregate, -cc`; trigger thêm: `-action-trigger` (sau khi submit form), `-custom-action-trigger`, `-request-interceptor` (pre-action), AI employee.
- **CollectionTrigger** (`triggers/CollectionTrigger.ts`): `mode` bitmap CREATE/UPDATE/DESTROY → lắng nghe `afterCreateWithAssociations`/`afterUpdateWithAssociations`/`afterDestroy`; `changed` (chỉ chạy khi field đổi), `condition` (filter), `appends`. **ScheduleTrigger**: `StaticScheduleTrigger` (cron) và `DateFieldScheduleTrigger` (theo trường ngày của record).
- Lưu trữ (`src/common/collections/`): `workflows` (`key` nhóm các version, `current`, `enabled`, `type`, `config`, `sync`), `flow_nodes` (danh sách liên kết `upstream`/`downstream` + `branchIndex` cho nhánh, `type`, `config`), `executions` (`context`, `status`, `eventKey` chống trùng, `parentExecutionId`), `jobs` (kết quả từng node, `status`, `result`).
- **Thực thi**: `Dispatcher` (`Dispatcher.ts`) — workflow `sync` chạy ngay trong request/transaction (`triggerSync`); async thì tạo execution `QUEUEING` và đẩy vào `app.eventQueue` (`packages/core/server/src/event-queue.ts`, adapter mặc định `MemoryEventQueueAdapter`, có thể thay Redis/RabbitMQ) → `onQueueTask` → `Processor` (`Processor.ts`) chạy tuần tự node, mỗi `Instruction.run()` trả job; job `PENDING` = tạm dừng (manual/delay/request) và `plugin.resume(job)` khi có tín hiệu. `recover()` khi khởi động nhặt các execution đang chờ; lock qua `lockManager`.
- Versioning: sửa workflow đã chạy → tạo revision mới cùng `key`.

### 9. Plugin system
- Server `Plugin` (`packages/core/server/src/plugin.ts`): lifecycle `afterAdd → beforeLoad → load → install (lần đầu) → afterEnable/afterDisable → upgrade → beforeRemove/afterRemove`, `handleSyncMessage` (cluster). `loadCollections()` tự import mọi file trong `src/server/collections/*.ts` (`defineCollection`), migration ở `src/server/migrations` (Umzug).
- Trong `load()` plugin thường: `db.registerFieldTypes/registerOperators/registerModels/registerRepositories`, `db.on('<collection>.afterCreate', ...)`, `app.resourceManager.define({ name, actions })` / `registerActionHandlers`, `app.acl.allow/registerSnippet`, `app.on('beforeStart')`.
- Danh sách plugin bật/tắt lưu ở `applicationPlugins` (`packages/core/server/src/plugin-manager/options/collection.ts`); cài từ npm/zip lúc runtime, client bundle tải động.
- Client `Plugin` (`packages/core/client-v2/src/Plugin.ts`): `afterAdd/beforeLoad/load`; đăng ký route, `schemaInitializerManager`, `flowEngine.registerModels`, `dataSourceManager.addFieldInterfaces`, `addCollectionTemplates`, `app.addComponents`.

### 10. AI Employees (2.0)
- `@nocobase/ai` (`packages/core/ai/src`: `ai-manager.ts`, `tools-manager`, `skills-manager`, `mcp-manager`, `document-manager`) dựa trên LangChain (`packages/core/ai/package.json`). `plugin-ai` (`packages/plugins/@nocobase/plugin-ai/src/server`): collections `aiEmployees` (`username`, `nickname`, `position`, `defaultPrompt`, `skillSettings`, `modelSettings`, `dataSourceSettings`, `knowledgeBase`...), `llmServices`, `aiConversations`, `aiMessages`, `aiToolMessages`, checkpoints `lc_checkpoints*` (LangGraph), quan hệ `rolesAiEmployees` (AI employee chịu ACL theo role).
- `AIEmployee.createAgent()` dùng `createAgent` của `langchain` (`ai-employees/ai-employee.ts` L40, L459); provider: `llm-providers/{openai,anthropic,google-genai,deepseek,ollama,mistral,...}`. Plugin khác thêm tool qua `ai.toolsManager.registerTools([...])` (`plugin-ai/src/server/plugin.ts` L194); có `workflow/nodes/{llm,employee}` và trigger `ai-employee` để nối với workflow; `plugin-mcp-server` expose app như MCP server.

### 11. Bài học thiết kế cho "Active Tables"
1. **Tách `type` (lưu trữ) và `interface` (UI/ngữ nghĩa)**: một registry phía server cho kiểu cột + operator, một registry phía client cho interface (form cấu hình, component hiển thị/nhập, operator filter). Thêm field mới = thêm plugin, không sửa core.
2. **Meta trong DB + cột JSON `options`** (MagicAttribute) cho cấu hình mở rộng; tên vật lý sinh tự động (`t_xxx`, `f_xxx`) tách khỏi `title` hiển thị.
3. **Bảng thật/cột thật** cho hiệu năng, index, FK, SQL thô — đánh đổi: DDL lúc runtime cần lock, transaction, đồng bộ cluster, và cẩn thận MySQL (có hook `beforeCreateCheckFieldInMySQL`). Nếu muốn multi-tenant SaaS nhiều tenant/1 DB, cân nhắc JSONB + generated column thay vì DDL.
4. **CRUD sinh tự động** cho mọi collection + query DSL thống nhất (`filter/appends/fields/sort/page`) dùng chung cho API, view, ACL scope, workflow condition — một parser duy nhất.
5. **ACL = merge params**: quyền trả về `filter` + `fields` rồi merge vào query; data scope chỉ là một filter JSON có biến ngữ cảnh.
6. **View = cây model JSON lưu trong closure table**, mỗi node có `uid` → sửa cục bộ (patch/insertAdjacent) không phải ghi đè cả trang; kanban/calendar/gantt chỉ là block khác nhau trên cùng resource `list`.
7. **Workflow tách trigger/instruction registry**, node dạng linked-list + branchIndex, execution/job lưu DB để resume (human-in-the-loop, delay), queue có adapter thay thế được, chế độ sync cho validation trong transaction.
8. **Formula lưu vật lý, tính ở hook beforeSave**; sequence dùng bảng counter riêng — đơn giản, query/sort được, nhưng phải recompute khi đổi expression.
9. AI agent nên dùng chung ACL/role và tool registry của plugin thay vì API riêng.


---

## Teable

> Nguồn: `git clone --depth 1 github.com/teableio/teable` (snapshot 2026-10-22). Mọi path bên dưới tính từ root repo. Community Edition là AGPL-3.0, còn các package trong `packages/` là MIT (`README.md` §License). AI và automation nâng cao là tính năng trả phí, kích hoạt bằng license key.

### 1. Kiến trúc tổng thể
- Monorepo pnpm (`pnpm-workspace.yaml`):
  - `apps/nestjs-backend`: API NestJS. Mỗi domain là một module trong `src/features/*`, ví dụ `table`, `field`, `view`, `record`, `calculation`, `undo-redo`, `auth`, `access-token`, `collaborator`, `plugin`, `ai`.
  - `apps/nextjs-app`: UI Next.js.
  - `packages/core`: model, schema zod và logic dùng chung cho FE và BE (field, view, formula, op-builder, auth/role).
  - `packages/sdk`: React SDK, gồm grid canvas, hook và ShareDB client.
  - `packages/openapi`: định nghĩa route và schema bằng zod, sinh ra OpenAPI cùng axios client.
  - `packages/formula`: grammar ANTLR.
  - `packages/db-main-prisma`: Prisma cho metadata DB.
  - `packages/db-data-prisma`: client cho data DB.
  - `plugins/`: app plugin Next.js.
- Tách hai DB. Metadata nằm ở DB "main" (Prisma). Record nằm ở "data DB" và có thể là một Postgres khác cho từng space (BYODB). Các model liên quan: `DataDbConnection`, `SpaceDataDbBinding`; table service gọi `dataDbClientManager.dataPrismaForBase()` (`apps/nestjs-backend/src/features/table/table.service.ts`).
- Đang có một lõi v2 viết lại theo DDD/hexagonal. Nó nằm ở `packages/v2/*` (`core`, `adapter-*`, `contract-http`, `formula-sql-pg`, `field-dependency-core`…) và được bật theo từng base qua `Base.v2Enabled`. Controller rẽ nhánh bằng `@UseV2Feature(...)` / `cls.get('useV2')` (`features/record/open-api/record-open-api.controller.ts`). Ghi chú kiến trúc nằm ở `packages/v2/core/src/ARCHITECTURE.md` và `agents.md`.

### 2. Metadata model (`packages/db-main-prisma/prisma/template.prisma`)
- Phân cấp: `Space` → `Base` (`space_id`, `order`, `v2_enabled`, `provision_state`) → `TableMeta` (`table_meta`).
- `TableMeta`: `base_id`, `name`, `db_table_name`, `db_view_name`, `version`, `order`, `search_index` (jsonb), `provision_state`, `deleted_time`.
- `Field`: `type`, `options` (JSON string), `meta`, `ai_config`, `cell_value_type`, `is_multiple_cell_value`, `db_field_type`, `db_field_name`, `not_null`, `unique`, `is_primary`, `is_computed`, `is_lookup`, `is_conditional_lookup`, `lookup_linked_field_id`, `lookup_options`, `has_error`, `is_pending`, `version`, `order`.
- `View`: `type`, `filter`, `sort`, `group`, `options`, `column_meta` (đều là JSON string), `order`, `version`, `is_locked`, `enable_share`, `share_id`, `share_meta`.
- `Reference(from_field_id, to_field_id)`: các cạnh của đồ thị phụ thuộc giữa field.
- `Ops(collection, doc_id, doc_type, version, operation)`: lưu op ShareDB, unique theo `(collection, doc_id, version)`.
- `RecordHistory(table_id, record_id, field_id, before, after)` lưu lịch sử record. Ngoài ra có `Trash`/`RecordTrash` và `Comment`.
- Hàng đợi bền cho tính toán và thay đổi schema:
  - `ComputedUpdateOutbox` có `seed_record_ids`, `steps`, `edges`, `status`, `attempts`, `next_run_at`, `locked_by`, `plan_hash`.
  - `SchemaOperation` có `idempotency_key`, `phase`, `status`.
- ID có tiền tố (`packages/core/src/utils/id-generator.ts`): `spc`, `bse`, `tbl`, `fld`, `viw`, `rec`.

### 3. Lưu trữ vật lý
- Mỗi base là một schema Postgres đặt tên đúng bằng baseId (`dbProvider.createSchema(base.id)` trong `features/base/base.service.ts`). Mỗi bảng người dùng là một bảng thật tên `"<baseId>"."<tênHợpLệ>"` (`generateDbTableName` → `${baseId}.${name}` trong `db-provider/postgres.provider.ts`).
- DDL được sinh bằng **knex schema builder** rồi chạy bằng `$executeRawUnsafe` trên data DB. Lúc tạo bảng, các cột hệ thống là (`table.service.ts` dòng ~176):
  `__id` (string, unique), `__auto_number` (increments, PK), `__created_time`, `__last_modified_time`, `__created_by`, `__last_modified_by`, `__version`.
- Mỗi field là một cột, tên lấy từ `db_field_name`; `FieldService.generateDbFieldName` biến "My Field" thành `My_Field`.
- `DbFieldType` có các giá trị `TEXT | INTEGER | DATETIME | REAL | BLOB | JSON | BOOLEAN`. `JSON` map sang `jsonb`, và field đa giá trị (multi-select, user, attachment, link nhiều) đều lưu bằng jsonb. Logic ở `db-provider/create-database-column-query/create-database-column-field-visitor.postgres.ts`, dùng visitor pattern với mỗi loại field một hàm `visitXxxField`.
- Thứ tự dòng thủ công của từng view là một cột `__row_<viewId>` trong chính bảng dữ liệu (`features/view/constant.ts`, `view.service.ts`).
- Đổi kiểu field đi qua `features/field/field-calculate/field-converting.service.ts` (DDL rồi chuyển dữ liệu). Thay đổi schema dài hạn được ghi vào `SchemaOperation` và `provisionState` (`pending`/`ready`).

### 4. Hệ thống field
- Lớp gốc là `FieldCore` (`packages/core/src/models/field/field.ts`). Nó có các thuộc tính `type`, `options`, `cellValueType`, `isMultipleCellValue`, `dbFieldType` và các method abstract `cellValue2String`, `convertStringToCellValue` (dùng cho paste/typecast), `validateCellValue` (zod), `repair`, `accept(visitor)`.
- Mỗi loại field có một class `XxxFieldCore` và option schema riêng trong `models/field/derivate/`.
- `FieldType` (`models/field/constant.ts`): singleLineText, longText, user, attachment, checkbox, multipleSelect, singleSelect, date, number, rating, formula, rollup, conditionalRollup, link, createdTime, lastModifiedTime, createdBy, lastModifiedBy, autoNumber, button.
- `CellValueType` chỉ có 4 giá trị: `string | number | boolean | dateTime`. Kết hợp với `isMultipleCellValue` là đủ để biết toán tử filter nào áp dụng được và cách chọn kiểu cột.
- **Link** (`link-option.schema.ts`):
  - Option gồm `relationship` (`oneOne | oneMany | manyOne | manyMany`), `foreignTableId`, `lookupFieldId`, `isOneWay`, `symmetricFieldId` (trường đối xứng ở bảng kia khi link hai chiều), `fkHostTableName`, `selfKeyName`, `foreignKeyName`, `filter`, `filterByViewId`, `visibleFieldIds`, và `baseId` khi link khác base.
  - Cách lưu vật lý phụ thuộc relationship (`createForeignKeyForLinkField`):
    - manyMany: tạo junction table `junction_<fieldId>[_<symmetricFieldId>]` (`field-supplement.service.ts:259`), có 2 FK trỏ tới `__id` và một unique index.
    - manyOne/oneOne: thêm cột FK `__fk_*` vào chính bảng, kèm `<fk>_order`.
    - oneMany: thêm FK ở bảng đích. Riêng oneMany một chiều thì vẫn dùng junction.
  - Ngoài ra field link còn có một cột jsonb cache giá trị `{id, title}` để hiển thị.
- **Lookup**: không phải một FieldType riêng. Bất kỳ field nào có `isLookup=true` cùng `lookupOptions {linkFieldId, foreignTableId, lookupFieldId}` là lookup. **Rollup** và conditionalRollup đều có cột vật lý để lưu giá trị đã tính.
- **Formula**:
  - Grammar ANTLR nằm ở `packages/formula/src/parser/Formula.g4` và `FormulaLexer.g4`, sinh code bằng `antlr4ts`.
  - Có hai đường xử lý:
    - (a) `EvalVisitor` (`packages/core/src/formula/visitor.ts`) cùng `functions/*` (text, numeric, date-time, logical, array) suy kiểu và tính phía app.
    - (b) Biên dịch sang SQL bằng `features/record/query-builder/sql-conversion.visitor.ts` và `db-provider/generated-column-query/postgres/*`.
  - Khi một formula hợp lệ cho generated column, cột được tạo là `GENERATED ALWAYS AS (<sql>) STORED` và `meta.persistedAsGeneratedColumn` được đặt (`createFormulaColumns`). Ngược lại thì dùng cột thường, giá trị do engine tính rồi ghi vào.
- **Đồ thị phụ thuộc và tính lại**:
  - Bảng `reference` lưu các cạnh. `ComputedDependencyCollectorService` duyệt bao đóng bằng `WITH RECURSIVE dep_graph` trên `reference` (`features/record/computed/services/computed-dependency-collector.service.ts:657-666`), rồi tìm các record bị ảnh hưởng qua link backref (`link-cascade-resolver.ts`).
  - `ComputedEvaluatorService.evaluate` chia field thành các lớp theo thứ tự topo (`buildFieldLayers`). Với mỗi lớp, nó dựng SELECT bằng `RecordQueryBuilder`, trong đó CTE cho link/lookup/rollup nằm ở `field-cte-visitor.ts`. Kết quả được phân trang, rồi ghi lại bằng `updateFromSelect` (`record-computed-update.service.ts`). Toàn bộ việc tính được đẩy xuống SQL.
  - `ComputedOrchestratorService` điều phối việc này trong transaction và sinh op `setRecord` để publish. Code cũ hơn ở `features/calculation/` (`reference.service.ts`, `link.service.ts`, `batch.service.ts`); README trong đó giải thích thuật toán topo với cơ chế "phân nhánh recordId qua link".
  - Với khối lượng lớn, việc tính được đẩy ra `ComputedUpdateOutbox` để xử lý bất đồng bộ (`features/v2/computed-outbox-trigger/`).

### 5. Views
- `ViewType` có grid, calendar, kanban, form, gallery, plugin (`packages/core/src/models/view/constant.ts`). Option của từng loại nằm ở `models/view/derivate/*-view-option.schema.ts`, ví dụ kanban dùng `stackFieldId` và gallery dùng `coverFieldId`.
- `columnMeta` là map `fieldId → {order, width, hidden, statisticFunc…}` (`column-meta.schema.ts`).
- Filter là một cây `{conjunction: and|or, filterSet: [filterItem | filter]}`, với `filterItem = {fieldId, operator, value}` (`models/view/filter/filter.ts`, `operator.ts`). Ngoài ra còn `sort` (`sortObjs`, `manualSort`) và `group`.
- Từ filter ra SQL: `db-provider/filter-query/postgres/filter-query.postgres.ts` duyệt cây filter. Mỗi tổ hợp cellValueType × single/multiple có một adapter trong `cell-value-filter/{single-value,multiple-value}/*`. Ví dụ `contains` thành `iLIKE '%v%' ESCAPE`, còn mảng jsonb dùng `@> jsonb_build_array(?)`. Sort, group, search và aggregation có thư mục riêng trong `db-provider/`.
- Request có thể gộp filter của view với filter truyền vào (`mergeFilter` trong `filter.ts`), hoặc bỏ qua bằng `ignoreViewQuery`.
- Grid vẽ bằng canvas (`packages/sdk/src/components/grid/` gồm `RenderLayer`, `InfiniteScroller`, `renderers/`). Dữ liệu tải theo cửa sổ skip/take: `INITIAL_LOAD_PAGE_SIZE=64` và `LOAD_PAGE_SIZE=300` (`packages/sdk/src/utils/record-window.ts`, `grid-enhancements/hooks/use-grid-async-records.ts`). API cũng hỗ trợ keyset `cursor`/`nextCursor` (`packages/openapi/src/record/get-list.ts`).

### 6. Realtime
- Dùng ShareDB với kiểu OT **json0**. `ShareDbService` extend ShareDB, còn pubsub chạy trong process hoặc qua `RedisPubSub` (`apps/nestjs-backend/src/share-db/share-db.service.ts`, `sharedb-redis.pubsub.ts`).
- `ShareDbAdapter` là một ShareDB DB tự viết: snapshot được đọc thẳng từ table/field/view/record service, còn `commit()` không được implement (`share-db.adapter.ts:258`).
- Luồng ghi: client gọi REST, service ghi DB trong transaction và dùng `packages/core/src/op-builder/*` (`RecordOpBuilder.editor.setRecord`, `addRecord`, ...) để tạo raw op, giữ trong CLS `tx.rawOpMaps`. Sau khi transaction commit (`bindAfterTransaction`), `publishOpsMap` publish lên kênh `<collection>` và `<collection>.<docId>`, đồng thời phát event nội bộ qua `ops2Event`.
- Middleware `submit` chặn op do client gửi trực tiếp, chỉ trừ record op và nguồn projection của v2. Client subscribe query/doc qua `connection.createSubscribeQuery` (`packages/sdk/src/context/use-instances/useInstances.ts`).
- Undo/redo không dựa trên OT inverse. Mỗi thao tác là một "operation" có thể đảo ngược (`features/undo-redo/operations/*`: create-records, update-records, convert-field, paste-selection…). Stack được lưu trong cache với key `operations:undo:${userId}:${tableId}:${windowId}` (`stack/undo-redo-stack.service.ts`).

### 7. API
- REST lồng theo bảng: `api/table/:tableId/record`, `api/table/:tableId/field`, `api/table/:tableId/view` (các controller `open-api/*.controller.ts`).
- Record có các route:
  - `GET` (list), `GET :recordId`, `POST` (batch create), `PATCH` (batch update), `PATCH :recordId`, `DELETE` (batch), `DELETE :recordId`.
  - `POST form-submit`, `:recordId/duplicate`, `:recordId/history`, upload attachment, `button-click`.
- Query của `GET` (`packages/openapi/src/record/get-list.ts`): `viewId`, `ignoreViewQuery`, `filter` (JSON), `filterByTql`, `search`, `orderBy`, `groupBy`, `projection`, `take` (có giới hạn `maxPageSize`), `skip`, `cursor`, `fieldKeyType` (`name | id | dbFieldName`, enum `FieldKeyType` trong `packages/core/src/models/record/record.ts`), `cellFormat`, `filterLinkCellSelected`.
- Pipe xử lý: `ZodValidationPipe`, `FieldKeyPipe`, `TqlPipe`, `AccessTokenTakeLimitPipe`. Đặc tả OpenAPI được sinh từ zod (`packages/openapi/src/generate.schema.ts`, `apps/nestjs-backend/src/swagger.ts`).
- Xác thực (`features/auth/strategies/`): session cookie, JWT, OAuth (GitHub/Google/OIDC/Apple), và Personal Access Token (`access-token.strategy.ts`). Model `AccessToken` có `scopes`, `space_ids`, `base_ids`, `sign`, `expired_time`, `has_full_access`. Còn có OAuth app (`OAuthApp*`).

### 8. Phân quyền
- Có 5 role: `owner | creator | editor | commenter | viewer` (`packages/core/src/auth/role/types.ts`). `BaseRole` không có owner; `TableRole` chỉ có creator/editor/viewer (`role/base.ts`, `role/table.ts`).
- Action có dạng `resource|verb`, ví dụ `space|create`, `record|read`, `field|create`, `table_record_history|read` (`packages/core/src/auth/actions.ts`). Bảng role → action nằm trong `RolePermission` (`role/constant.ts`).
- Gán quyền qua `Collaborator(role_name, resource_type, resource_id, principal_id, principal_type)`. `resource_type` có thể là space hoặc base, `principal` có thể là user hoặc department (`CollaboratorType` và `PrincipalType` trong `packages/openapi/src/space/types.ts`).
- Endpoint khai báo quyền bằng `@Permissions('record|read')` và được `PermissionGuard` kiểm tra (`features/auth/guard/permission.guard.ts`, `permission.service.ts`).
- Ngoài ra có share view (`View.shareId`, `share-view-scope.service.ts`), base share, và quyền ở mức record (`record-permission.service.ts`).

### 9. Automation / Plugin / AI
- Automation: bản community chỉ có schema OpenAPI (`packages/openapi/src/automation/workflow`) và các field `Task`/`TaskRun`/`TaskReference`. Engine workflow thuộc bản trả phí, nên không thấy module tương ứng trong `features/`.
- Plugin: model `Plugin`, `PluginInstall`, `PluginPanel`, `PluginContextMenu`, `Dashboard`. View loại `plugin`; plugin chạy trong iframe và giao tiếp qua `packages/sdk/src/plugin-bridge`. App mẫu ở `plugins/`.
- AI: `features/ai/` (gateway model) và `Field.ai_config`, dùng cho AI field auto-fill (`POST :recordId/:fieldId/auto-fill`).

### 10. Bài học thiết kế cho "Active Tables"
1. Mỗi bảng người dùng là **một bảng Postgres thật**, mỗi field một cột, đặt trong schema riêng của base. Nhờ vậy filter, sort, aggregate, index và generated column đều chạy native. Đổi lại thì phải tự quản lý DDL và migrate kiểu khi đổi loại field.
2. Tách **metadata DB** (Prisma) khỏi **data DB** (raw SQL qua knex). ID có tiền tố (`tbl`, `fld`, `rec`) và luôn có `db_field_name` riêng, nên đổi tên hiển thị không cần DDL.
3. Cột hệ thống cố định: `__id`, `__auto_number` (PK, dùng để phân trang và làm tiebreak khi sort), `__version` (cho OT/optimistic), cùng created/modified time/by. Thứ tự thủ công của từng view là cột `__row_<viewId>`.
4. Hệ kiểu nhỏ gọn: FieldType cho UI, `cellValueType × isMultipleCellValue` cho ngữ nghĩa, `dbFieldType` cho lưu trữ. Visitor pattern cho từng mối quan tâm (tạo cột, filter, select/CTE, format).
5. Link dùng FK hoặc junction thật tùy relationship, cộng một cột jsonb cache `{id,title}`. Link hai chiều thực hiện bằng `symmetricFieldId`.
6. Field tính toán: lưu cạnh phụ thuộc vào bảng `reference`, duyệt bao đóng bằng recursive CTE, chạy theo lớp topo, và **đẩy việc tính xuống SQL** (formula→SQL, CTE cho lookup/rollup). Hàng đợi outbox cho batch lớn. Nên làm điều này từ sớm, vì đây là phần khó nhất.
7. Realtime: ghi qua REST/transaction, sau khi commit thì publish op json0 qua ShareDB + Redis. Không cho client tự commit op tùy ý.
8. Undo/redo là command có thể đảo ngược, lưu stack theo user/table/window trong cache. Cách này đơn giản hơn nhiều so với undo dựa trên OT.
9. Query API dùng một DSL thống nhất (filter tree JSON, `orderBy`, `groupBy`, `projection`, `fieldKeyType`, `viewId` + `ignoreViewQuery`), có schema zod dùng chung FE/BE và sinh OpenAPI từ zod.
10. RBAC đơn giản: 5 role, map sang action `resource|verb`, gán qua `Collaborator` ở mức space hoặc base, enforce bằng decorator trên controller.


---

## Grist

> Nguồn: `gristlabs/grist-core` (Apache-2.0), clone `--depth 1` ngày 2026-10-22. Mọi path dưới đây là tương đối từ root repo. `SCHEMA_VERSION = 46` (`sandbox/grist/schema.py`).

### 1. Kiến trúc tổng thể

- **3 tầng code**: `app/client` (TS, UI dùng knockout + grainjs), `app/server` + `app/gen-server` (Node/TS, Express), `sandbox/grist` (Python data engine). Code chia sẻ client/server nằm ở `app/common` (vd `DocActions.ts`, `schema.ts`, `ACLPermissions.ts`, `PredicateFormula.ts`).
- **Home DB và document DB tách hẳn nhau**:
  - Home DB lưu org/workspace/doc/user/ACL ở mức "ai được mở doc nào". Dùng TypeORM, entity ở `app/gen-server/entity/*` (`Organization`, `Workspace`, `Document` → bảng `docs`, `AclRule` → bảng `acl_rules`, `Group`, `User`, `Share`…). Driver là SQLite mặc định hoặc Postgres qua `TYPEORM_TYPE` (`app/server/lib/dbUtils.ts:170`). Truy cập qua `app/gen-server/lib/homedb/HomeDBManager.ts`, REST ở `app/gen-server/ApiServer.ts`.
  - Mỗi document là **một file SQLite** (`app/server/lib/DocStorage.ts`, header ghi: "A Grist document is stored as a SQLite database file… including attachments").
- **Server roles**: `app/server/lib/FlexServer.ts` ghép các thành phần (home API `addHomeApi()`, doc worker, `addDocWorkerMap()`). Khi chạy nhiều worker, doc được gán cho worker qua `DocWorkerMap` dùng Redis (`app/gen-server/lib/DocWorkerMap.ts`). Snapshot/backup lên S3/MinIO qua `HostedStorageManager.ts` và `MinIOExternalStorage.ts`.
- **ActiveDoc**: mỗi doc đang mở có đúng một instance `ActiveDoc` (`app/server/lib/ActiveDoc.ts`), do `DocManager.ts` quản lý. ActiveDoc giữ `DocStorage` (SQLite), một **sandbox Python riêng cho doc đó**, `GranularAccess`, `Sharing` và `DocClients`.
- **Sandbox**: `app/server/lib/NSandbox.ts` spawn process Python và nói chuyện qua pipe bằng format `marshal` (`app/common/marshal.ts`). Các flavor nằm trong `const spawners`: `unsandboxed`, `docker`, `gvisor` (runsc, `sandbox/gvisor/`), `macSandboxExec`, `pyodide` (`SandboxPyodide.ts`, `sandbox/pyodide/`), chọn qua `GRIST_SANDBOX_FLAVOR`. (Pynbox là cơ chế cũ, bản hiện tại không còn.) Entry point Python là `sandbox/grist/main.py`: các hàm `@export` như `apply_user_actions`, `load_meta_tables`, `load_table`, `create_migrations`. Khi mở doc, `TableMetadataLoader` đọc bảng từ SQLite rồi đẩy vào Python (`ActiveDoc.ts:~500`), nên **toàn bộ dữ liệu của doc nằm trong RAM của engine**.

### 2. Lưu trữ document

- Bảng metadata do engine tự định nghĩa bằng `actions.AddTable(...)` trong `sandbox/grist/schema.py`, và được sinh sang TS ở `app/common/schema.ts` (`sandbox/gen_js_schema.py`):
  - `_grist_Tables`: `tableId`, `primaryViewId`, `summarySourceTable`, `onDemand`, `rawViewSectionRef`, `recordCardViewSectionRef`
  - `_grist_Tables_column`: `parentId`, `parentPos`, `colId`, `type`, `widgetOptions` (JSON), `isFormula`, `formula`, `label`, `displayCol`, `visibleCol`, `rules`, `reverseCol`, `recalcWhen`, `recalcDeps`, `summarySourceCol`
  - `_grist_Pages`, `_grist_Views` (`layoutSpec`), `_grist_Views_section` (`parentKey` = loại widget, `filterSpec`, `sortColRefs`, `linkSrcSectionRef`, `linkSrcColRef`, `linkTargetColRef`, `chartType`, `options`), `_grist_Views_section_field`, `_grist_Filters`
  - `_grist_ACLResources` (`tableId`, `colIds`) và `_grist_ACLRules` (`resource`, `aclFormula`, `aclFormulaParsed`, `permissionsText`, `rulePos`, `userAttributes`, `memo`)
  - `_grist_Attachments`, `_grist_Triggers` (webhook), `_grist_Cells` (comment), `_grist_Shares`, `_grist_DocInfo`
- Bảng hệ thống phía Node (`_gristsys_ActionHistory`, `_gristsys_ActionHistoryBranch`, `_gristsys_Files` chứa attachment blob, `_gristsys_FileInfo`, `_gristsys_PluginData`) được tạo trong `DocStorage.ts:~102-160`. Version schema của chúng theo `PRAGMA user_version`.
- **User table** là bảng SQLite thật, có cột `id INTEGER PRIMARY KEY` cộng một cột cho mỗi Grist column, kể cả formula column (giá trị đã tính được lưu lại). Có thêm cột ẩn `manualSort` (`app/common/gristTypes.ts` `MANUALSORT`).
- **Kiểu cột** (`app/common/gristTypes.ts` `_defaultValues`, `DocStorage._getSqlType`): `Any, Text, Numeric, Int, Bool, Date, DateTime:<tz>, Choice, ChoiceList, Ref:<Table>, RefList:<Table>, Attachments, Blob, Id, PositionNumber, ManualSortPos`.
  - `Ref` lưu thành INTEGER, với 0 nghĩa là rỗng.
  - `RefList`, `ChoiceList` và `Attachments` lưu thành TEXT chứa JSON array.
  - `Attachments` thực chất là `RefList:_grist_Attachments`.
  - Kiểu tham số hoá nằm ngay trong chuỗi type (`"Ref:Table1"`, `"DateTime:America/New_York"`).
  - Giá trị phức tạp (lỗi formula, …) được marshal (`DocStorage._encodeValue`).

### 3. Mô hình Action

- **DocAction** là đơn vị thay đổi nhỏ nhất, dạng tuple JSON (`app/common/DocActions.ts`, bản Python ở `sandbox/grist/actions.py`):
  - Data: `AddRecord`, `BulkAddRecord`, `UpdateRecord`, `BulkUpdateRecord`, `RemoveRecord`, `BulkRemoveRecord`, `ReplaceTableData`, `TableData`
  - Schema: `AddTable`, `RemoveTable`, `RenameTable`, `AddColumn`, `RemoveColumn`, `RenameColumn`, `ModifyColumn`
- **UserAction** là ý định ở mức cao hơn, được xử lý trong `sandbox/grist/useractions.py` (`@useraction`). Ví dụ: `AddOrUpdateRecord`, `BulkAddOrUpdateRecord`, `AddVisibleColumn`, `ConvertFromColumn`, `AddReverseColumn`, `DuplicateTable`, `CreateViewSection`, `UpdateSummaryViewSection`, `RenameChoices`, `ApplyUndoActions`, `Calculate`. Một UserAction có thể sinh ra nhiều DocAction, kể cả thay đổi metadata. Ví dụ sửa `_grist_Tables_column` thì engine tự sinh `ModifyColumn`.
- **Luồng xử lý một thay đổi** (mọi thay đổi đều đi qua engine):
  1. Client → `ActiveDoc.applyUserActions()` (`ActiveDoc.ts:1655`).
  2. `Sharing.addUserAction()` (`app/server/lib/Sharing.ts`) chạy tuần tự dưới `_modificationLock` (Mutex).
  3. `_applyActionsToDataEngine()` gọi Python `Engine.apply_user_actions()` (`sandbox/grist/engine.py:1329`). Kết quả là `ActionGroup` (`action_obj.py`) gồm `stored`, `calc`, `undo`, `retValues`. Nếu lỗi giữa chừng thì engine tự `_undo_to_checkpoint`.
  4. `GranularAccess.canApplyBundle()`. Nếu bị từ chối, Node gửi `ApplyUndoActions` để engine quay lại trạng thái cũ (`Sharing.ts:244-305`).
  5. Trong một transaction SQLite: `applyStoredActionsToDocStorage()` dịch DocAction thành SQL, rồi `ActionHistory.recordNextShared()`.
  6. `handleTriggers()` chạy webhook, sau đó `sendDocUpdateForBundle()` broadcast tới client.
- Như vậy engine Python là "source of truth" về logic, còn SQLite chỉ là nơi persist. Node không tự ý sửa user data.
- **Action history**: `LocalActionBundle` (`app/common/ActionBundle.ts`) gồm `actionNum`, `actionHash`, `parentActionHash` (một chuỗi hash kiểu git), `info` (user, time), `userActions`, `stored`, `calc`, `undo`. Bundle được lưu vào `_gristsys_ActionHistory` (`ActionHistoryImpl.ts`), cắt bớt theo `GRIST_ACTION_HISTORY_MAX_ROWS` (mặc định 1000) và `GRIST_ACTION_HISTORY_MAX_BYTES`.
- **Undo/redo**: undo stack nằm ở client (`app/client/components/UndoStack.ts`). Server undo bằng cách chạy lại `["ApplyUndoActions", bundle.undo]` ở chế độ `bestEffort` (`ActiveDoc.ts:~1720`), có kiểm tra `actionHash` để chắc chắn đúng bundle. `linkId`/`otherId` dùng để gom nhiều action thành một bước undo.

### 4. Formula engine

- Formula viết bằng **Python đầy đủ**, có `$col` là đường tắt của `rec.col`. `codebuilder.py` dùng `DOLLAR_REGEX`, `asttokens`/`astroid` để viết lại code. `gencode.py` sinh từ schema ra một module Python, mỗi bảng là một class `@grist.UserTable`, mỗi formula column là một method (ví dụ mẫu ở `sandbox/grist/usercode.py`). Hàm kiểu Excel nằm ở `sandbox/grist/functions/`.
- **Dependency tracking tự động khi chạy** (`sandbox/grist/depend.py`, cảm hứng từ ninja build):
  - `Node(table_id, col_id)` biểu diễn một cột.
  - `Edge(out_node, in_node, relation)`, trong đó `relation` (`relation.py`) ánh xạ hàng nào phụ thuộc hàng nào. Ví dụ qua Ref thì chỉ hàng trỏ tới mới bị ảnh hưởng.
  - Khi formula truy cập `rec.X`, `Record`/`RecordSet` ghi lại edge đó, nên không cần phân tích tĩnh.
- **Recalc**: `invalidate_column` / `invalidate_records` đánh dấu dirty vào `recompute_map`. `_bring_all_up_to_date()` → `_recompute()` → `_recompute_step()` tính lazily theo từng cell và phát hiện vòng lặp bằng `CircularRefError`. Kết quả được gom thành `BulkUpdateRecord` trong phần `calc`/`stored` (`flush_calc_changes`). Formula không deterministic như `NOW()` được làm mới qua user action `UpdateCurrentTime`.
- **Lookup**: `Table.lookupRecords(**kw)` và `lookupOne` (`table.py:59,105`) dùng index trong `lookup.py`. Dependency được tạo trên chính lookup map.
- **Trigger formula** ("data column có formula"): đánh dấu bằng `isFormula=False` cộng với `formula`. `recalcWhen` (`schema.py` class `RecalcWhen`) có 3 giá trị: `DEFAULT` (tính khi thêm record hoặc khi cột trong `recalcDeps` đổi), `NEVER`, `MANUAL_UPDATES`. Engine dùng `_prevent_recompute_map` để không ghi đè giá trị người dùng vừa nhập (`engine.py:~1349`).

### 5. Reference, quan hệ, summary

- `Ref:T` lưu row id. `RefList:T` lưu list row id. `displayCol`/`visibleCol` chỉ cột dùng để hiển thị: engine tạo một cột formula ẩn `gristHelper_Display` (`isHiddenCol` trong `gristTypes.ts`).
- **Two-way reference**: cột `reverseCol` trong `_grist_Tables_column` và UserAction `AddReverseColumn`. `sandbox/grist/reverse_references.py` (`get_reverse_adjustments`) tính phần thêm/bớt để cập nhật cột đối xứng (xem test `test_twoway_refs.py`).
- **Summary table** (group-by): `sandbox/grist/summary.py`.
  - Tên bảng sinh theo `encode_summary_table_name`, ví dụ `Orders_summary_Region_Year`.
  - Bảng có `_grist_Tables.summarySourceTable`.
  - Cột `group` kiểu `RefList:<Source>` chứa các hàng nguồn.
  - Cột số mặc định là formula `SUM($group.col)`.
  - Engine tự thêm/xoá nhóm khi dữ liệu nguồn đổi (`apply_auto_removes`).

### 6. View, page, widget

- **Page** là `_grist_Pages` (cây phân cấp qua `indentation`, `pagePos`) và trỏ tới `_grist_Views`. Một view có `layoutSpec` (JSON) để sắp xếp các **section**.
- **Section** (`_grist_Views_section`) chính là widget. `parentKey` là kiểu widget theo `app/common/widgetTypes.ts`: `record` = Table, `single` = Card, `detail` = Card List, `chart`, `custom`, `form`, `calendar`. Phía client có `GridView.ts`, `DetailView.ts`, `ChartView.ts`, `CustomView.ts` (iframe dùng `app/plugin/` API) trong `app/client/components/`. Field của widget nằm ở `_grist_Views_section_field` (thứ tự, width, `widgetOptions` override).
- **Raw data**: mỗi bảng có `rawViewSectionRef` và `recordCardViewSectionRef` riêng.
- **Linking** (filter theo selection): lưu ở `linkSrcSectionRef`, `linkSrcColRef`, `linkTargetColRef`. `app/client/components/LinkingState.ts` suy ra `LinkType` như `Filter:Col->Col`, `Show-Referenced-Records`, `Summary`, `Cursor:Same-Table`… và sinh `filterColValues` (lọc ở client) hoặc `cursorPos`.
- **Filter/sort**: sort lưu trong `sortColRefs` (JSON, cột âm nghĩa là giảm dần, xem `app/common/SortSpec.ts`). Filter lưu trong `_grist_Filters` (`viewSectionRef`, `colRef`, `filter` JSON, `pinned`). Cả hai là metadata dùng chung, sửa bằng action nên undo được. Bản nháp chưa lưu chỉ nằm ở client.

### 7. Access rules

- Có 2 lớp:
  1. **Role thô** (owner/editor/viewer) lấy từ home DB (`app/common/roles.ts`, `DocAuthorizer.ts`).
  2. **Granular ACL** lưu ngay trong doc (`_grist_ACLResources` + `_grist_ACLRules`). Resource là `tableId` + `colIds` (`'*'` = mọi). Mỗi rule có `aclFormula` (predicate) và `permissionsText`, ví dụ `+R-U`. Các bit là `read`, `update`, `create`, `delete`, `schemaEdit` (`ACLPermissions.ts`). Bảng có CRUD đủ 4 bit, cột chỉ có `read` và `update`.
- Predicate formula là một tập con của Python (`rec.office == 'Seattle' and user.Email in [...]`):
  - Được parse **một lần** bằng Python `parse_predicate_formula` (`sandbox/grist/predicate_formula.py`) thành cây JSON, lưu ở `aclFormulaParsed`.
  - Được biên dịch thành hàm JS bằng `compilePredicateFormula` (`app/common/PredicateFormula.ts`). Vì vậy **ACL được đánh giá ở Node**, không cần gọi Python.
  - Biến `user` có thể mở rộng bằng `userAttributes` (lookup sang một bảng trong doc, `ACLRuleCollection.getUserAttributeRules()`).
- Đánh giá rule: `PermissionInfo.ts` `evaluateRule()` gộp các rule theo thứ tự `rulePos`. Nếu một rule cần dữ liệu hàng (`NEED_ROW_DATA`) thì trả về trạng thái `allowSome`/`denySome`/`mixed`, và khi đó mới phải kiểm tra từng hàng.
- `GranularAccess.ts` móc vào từng pha của bundle: `checkUserActions` → `canApplyBundle` (so sánh hàng trước/sau qua `undo`, `_filterRowsAndCells`) → `appliedBundle` → `sendDocUpdateForBundle` → `finishedBundle`.
- Khi đọc, `filterData()` lọc bỏ hàng và cell bị cấm. Khi broadcast, `filterOutgoingDocActions()` **lọc DocAction riêng cho từng client**. Metadata của bảng/cột bị ẩn được "censor" bằng cách xoá trắng các field (`GranularAccess.ts:~3198`).

### 8. Realtime collaboration

- WebSocket chạy trên `ws` hoặc `engine.io` (`app/server/lib/GristSocketServer.ts`, `Comm.ts`, `Client.ts`). Client dùng `app/client/components/GristWSConnection.ts`.
- Mỗi doc chỉ có một ActiveDoc trên một worker và mọi thay đổi bị serialize bằng mutex. Nhờ đó **không cần OT/CRDT**: thứ tự action do server quyết định.
- Sau khi commit, `DocClients.broadcastDocMessage(client, "docUserAction", message, filterFn)` (`DocClients.ts:115`) gửi `{actionGroup, docActions, docUsage}` tới từng client, mỗi client một bản đã lọc theo ACL.
- Client nhận ở `GristDoc._onDocUserAction` (`GristDoc.ts:716,1480`) rồi gọi `docData.receiveAction()`, cập nhật bảng trong RAM (`app/client/models/DocData.ts`, `TableData.ts`) và UI tự re-render qua observable.
- Client cũng tải gần như toàn bộ doc vào RAM. Ngoại lệ là bảng `onDemand`, được giữ lại chỉ trong SQLite (`OnDemandActions.ts`).

### 9. API

- REST nằm ở `app/server/lib/DocApi.ts`:
  - Record: `GET|POST|PATCH|PUT /api/docs/:docId/tables/:tableId/records`. `PUT` là upsert, map sang `BulkAddOrUpdateRecord`. Ngoài ra có `POST .../records/delete` và `POST .../records/list`.
  - Dạng cột: `.../data` (legacy).
  - Schema: `GET|POST|PATCH /api/docs/:docId/tables` và `GET|POST|PATCH|PUT .../tables/:tableId/columns`, `DELETE .../columns/:colId`.
  - Gửi thẳng UserAction: `POST /api/docs/:docId/apply`.
  - SQL chỉ đọc: `GET|POST /api/docs/:docId/sql`.
  - Khác: attachments, `download/csv|xlsx`, `snapshots`, `states`, `compare`, `fork`.
  - Org/workspace/doc/user nằm ở `app/gen-server/ApiServer.ts`.
  - Mọi REST write đều chuyển thành UserAction và đi đúng pipeline ở mục 3, nên cũng qua ACL, formula và broadcast.
- **Webhook**:
  - Cấu hình là record trong `_grist_Triggers` (`tableRef`, `eventTypes` add/update, `isReadyColRef`, `watchedColRefList`, `condition`, `actions` JSON).
  - Quản lý qua `POST|GET|PATCH|DELETE /api/docs/:docId/webhooks[/:webhookId]` và `DELETE .../webhooks/queue` (`DocApiTriggers.ts:408-503`).
  - `DocTriggers.handle(localActionBundle)` (`app/server/lib/Triggers.ts:120`) so sánh trước/sau để sinh event và đẩy vào hàng đợi local/Redis (`WebhookQueue.ts`) có retry.
  - Điều kiện trigger được đánh giá bằng `TriggerConditionEval.ts`.

### 10. Bài học thiết kế cho "Active Tables"

**Nên học theo:**
1. **Schema-as-data**: bảng, cột, view, filter, ACL đều là record trong metadata table và được sửa bằng chính cơ chế action. Nhờ đó undo, history, realtime và permission hoạt động như nhau cho cả data lẫn schema.
2. **Hai tầng action**: UserAction (ý định, có logic) biên dịch ra DocAction (thay đổi nguyên thuỷ, có thể đảo ngược). Mọi DocAction có undo tương ứng, đây là nền cho undo/redo, rollback khi ACL fail, webhook và audit.
3. **Một writer duy nhất cho mỗi doc** (ActiveDoc + mutex): dễ đảm bảo nhất quán, không cần CRDT, broadcast diff đã lọc theo ACL.
4. **ACL bằng predicate formula parse một lần rồi đánh giá ở runtime phía server**, có tối ưu theo cấp bảng/cột trước khi phải kiểm tra từng hàng, và lọc cả payload realtime.
5. Dependency graph tính ở mức (cột, relation hàng), ghi lại lúc chạy, recalc tăng dần.
6. Định nghĩa widget/link/filter/sort lưu trong DB nên chia sẻ được, link giữa widget suy ra từ metadata.

**Trade-off của SQLite-per-document + Python engine:**
- (+) Cô lập tenant tự nhiên, backup/snapshot/fork/download chỉ là copy file, mỗi doc có schema linh hoạt (DDL thật).
- (+) Formula Python rất mạnh.
- (−) Toàn bộ doc phải nằm trong RAM (cả engine lẫn client). Grist giới hạn số dòng mỗi doc theo gói sản phẩm (`baseMaxRowsPerDocument` trong `app/common/DocLimits.ts`/`Features.ts`), nên không hợp với bảng hàng triệu dòng.
- (−) Không query/join chéo doc, báo cáo toàn tenant khó làm.
- (−) Mỗi doc tốn một process sandbox (gVisor/pyodide), cold-start chậm, phải có cơ chế gán doc cho worker (Redis `DocWorkerMap`) và đồng bộ file lên S3.
- (−) Thực thi code người dùng nên bắt buộc phải sandbox, ops phức tạp.
- (−) Ghi bị serialize trên từng doc nên throughput write có giới hạn.

**Gợi ý cho sản phẩm "Active Tables" dùng DB đa tenant (Postgres):**
- Giữ mô hình metadata (tables/columns/views/sections/filters/acl_rules) và hai tầng action. Lưu log DocAction kèm undo để có history/undo.
- Thay engine Python bằng formula DSL hạn chế (đánh giá ở server, có dependency graph theo cột), hoặc chỉ cho phép formula "trigger/lookup" đơn giản.
- Tách bảng record (row lưu JSONB hoặc EAV) thay cho DDL theo từng doc nếu cần scale số dòng và query chéo.
- Dùng ACL kiểu Grist: rule theo bảng/cột có điều kiện trên `rec`/`user`, đánh giá ở API layer và lọc cả event realtime.


---

## NocoDB

> Nguồn: `git clone --depth 1 github.com/nocodb/nocodb` (snapshot 2026-10-22). **License: Sustainable Use License** (`LICENSE.md`, cập nhật 2026-01-29). Chỉ được dùng nội bộ hoặc phi thương mại, nên ở đây chỉ nghiên cứu thiết kế, **không copy code**. Mọi path bên dưới là path tương đối từ gốc repo.
> Lưu ý: repo public là bản CE. Nhiều tính năng (realtime, undo, presence) chỉ còn **stub rỗng**, bản thật nằm trong EE (xem mục 7).

### 1. Kiến trúc tổng thể
- Đây là monorepo pnpm/lerna (`pnpm-workspace.yaml`, `lerna.json`). Các package chính:
  - `packages/nocodb`: backend NestJS (`src/app.module.ts`, `src/Noco.ts`). Code chia lớp như sau: `controllers/` → `services/` → `models/` (Active Record cho meta) → `db/` (engine truy vấn dữ liệu).
  - `packages/nc-gui`: Nuxt 3/Vue 3, Pinia stores (`store/*.ts`), composables (`composables/useInfiniteData.ts`, `useGridViewData.ts`). Grid vẽ bằng **canvas** (`components/smartsheet/grid/canvas/`).
  - `packages/nocodb-sdk`: phần dùng chung FE/BE, gồm `UITypes` (`src/lib/UITypes.ts`), mapping dialect (`src/lib/sqlUi/PgUi.ts`, `MysqlUi.ts`, `SqliteUi.ts`, `MssqlUi.ts`…), formula parser (`src/lib/formula/`), filter parser (`src/lib/parser/queryFilter/`), roles (`src/lib/enums.ts`).
- **Meta DB và data source**:
  - Meta DB được cấu hình bằng `NC_DB`, `NC_DB_JSON` hoặc `NC_DB_JSON_FILE` (`src/utils/nc-config/NcConfig.ts`). Truy cập qua `MetaService` (`src/meta/meta.service.ts`), migrations nằm trong `src/meta/migrations/v2/nc_0xx_*.ts` (88 file).
  - Phân cấp: **Workspace** (`workspace`) → **Base** (`nc_bases_v2`, trước đây gọi là "project") → **Source** (`nc_sources_v2`, trước đây gọi là "base"). Đổi tên ở `nc_037_rename_project_and_base.ts`: `base_id`→`source_id`, `project_id`→`base_id`.
  - `Source` (`src/models/Source.ts`) có các trường `type` (DriverClient), `is_meta`, `is_local`, `is_schema_readonly`, `is_data_readonly`, `config` (mã hoá, `decryptPropIfRequired`), `inflection_table/column`, `fk_integration_id`.
  - Khi `is_meta`/`is_local` bật, dữ liệu user nằm ngay trong meta DB (gọi là "xcdb"). Ngược lại là một DB ngoài (PG/MySQL/SQLite/MSSQL/Oracle/Snowflake/Databricks, xem `src/db/sql-client/lib/*`).
  - Connection pool cho mỗi source là một Knex instance cache trong LRU: `NcConnectionMgrv2.get(source)` (`src/utils/common/NcConnectionMgrv2.ts`). Có version tracker trên Redis để invalidate khi config thay đổi.
- Cache meta: `NocoCache` (`src/cache/NocoCache.ts`), chạy bằng Redis hoặc in-memory (`RedisCacheMgr.ts` / `RedisMockCacheMgr.ts`).
- Job queue dùng Bull + Redis (`src/modules/jobs/redis/`), không có Redis thì dùng in-memory (`src/modules/jobs/fallback/fallback-queue.service.ts`).

### 2. Mô hình metadata (`src/utils/globals.ts` → `enum MetaTable`; schema gốc ở `src/meta/migrations/v2/nc_011.ts`)
- `nc_models_v2` (Model): `id`, `base_id`, `source_id`, `table_name` (tên vật lý), `title` (tên hiển thị), `type` (`table`/`view`), `meta`, `mm` (bool, đánh dấu bảng junction), `enabled`, `order`.
- `nc_columns_v2` (Column): `fk_model_id`, `title`, `column_name`, `uidt` (UI type), `dt` (kiểu DB), cùng các thuộc tính DDL `np/ns/clen/dtx/dtxp/dtxs/cdf/ct`, các cờ `pk/pv` (primary value, tức display field)`/rqd/un/ai/au/unique/system/virtual`, và `meta` (JSON).
- Mỗi loại cột phức tạp có bảng option riêng ("colOptions"):
  - `nc_col_relations_v2`: `type` (hm/bt/mm/oo), `fk_related_model_id`, `fk_child_column_id`, `fk_parent_column_id`, `fk_mm_model_id`, `fk_mm_child_column_id`, `fk_mm_parent_column_id`, `ur/dr` (on update/delete), `fk_index_name`, `virtual`.
  - `nc_col_lookup_v2`: `fk_relation_column_id`, `fk_lookup_column_id`.
  - `nc_col_rollup_v2`: `fk_relation_column_id`, `fk_rollup_column_id`, `rollup_function`.
  - `nc_col_formula_v2`: `formula`, `formula_raw`, `parsed_tree` (`nc_011.ts` ~270, `src/models/FormulaColumn.ts`).
  - `nc_col_select_options_v2`, `nc_col_qrcode_v2`, `nc_col_barcode_v2`, `nc_col_button_v2`, `nc_col_long_text_v2`.
- Views:
  - `nc_views_v2` gồm `fk_model_id`, `type` (enum `ViewTypes`: FORM=1, GALLERY=2, GRID=3, KANBAN=4, MAP=5, CALENDAR=6, LIST=7, TIMELINE=8, GANTT=9 trong `nocodb-sdk/src/lib/globals.ts`), `is_default`, `lock_type` (`collaborative`/locked/personal), `uuid`+`password` (dùng cho shared view), `meta`.
  - Mỗi loại view có 1 bảng config + 1 bảng cột, ví dụ `nc_grid_view_v2` + `nc_grid_view_columns_v2` (`fk_column_id`, `width`, `show`, `order`), `nc_kanban_view_v2` (`fk_grp_col_id`, `fk_cover_image_col_id`, `nc_020_kanban_view.ts`), `nc_gallery_view_v2` (`fk_cover_image_col_id`), `nc_form_view_v2`/`_columns_v2` (label, help, required…), `nc_calendar_view_v2` + `nc_calendar_view_range_v2` (`fk_from_column_id`, `fk_to_column_id`, `nc_041_calendar_view.ts`). Map, timeline và gantt cũng theo pattern này.
- `nc_filter_exp_v2` (`src/models/Filter.ts`) là **cây filter**: `fk_parent_id`, `is_group`, `logical_op` (and/or/not), `comparison_op`, `comparison_sub_op`, `value`, `fk_column_id`. Một bảng filter được dùng chung cho nhiều owner qua các khoá `fk_view_id` / `fk_hook_id` / `fk_link_col_id` / `fk_row_color_condition_id` / `fk_rls_policy_id` / `fk_widget_id`. `fk_value_col_id` dùng cho filter động (so với field khác).
- `nc_sort_v2`: `fk_view_id`, `fk_column_id`, `direction`, `order`.
- Các bảng khác: `nc_hooks_v2`, `nc_hook_logs_v2`, `nc_audit_v2`, `nc_comments`, `nc_api_tokens`, `nc_base_users_v2`, `workspace_user`, `nc_shared_views_v2`, `nc_file_references`, `nc_jobs`.
- Multi-tenant: các meta row đều mang `fk_workspace_id` + `base_id` (`nc_050_tenant_isolation.ts`). `MetaService.metaInsert2/metaList2(workspace_id, base_id, …)` luôn tự scope theo hai khoá này.
- ID meta là `string(20)` (xem `nc_011.ts`).

### 3. Lưu trữ vật lý
- **Mỗi bảng user tương ứng một bảng SQL thật, mỗi field thật là một cột SQL thật.** `TablesService.tableCreate` (`src/services/tables.service.ts`):
  - sanitize tên bảng;
  - với source meta thì gắn prefix `${base.prefix}_` (dòng ~1005);
  - `resolveFreePhysicalTableName` tránh trùng tên;
  - sau đó gọi `ProjectMgrv2.getSqlMgr(...).sqlOpPlus(source, 'tableCreate', …)`.
- DDL chạy qua `SqlMgrv2.sqlOpPlus(source, op, args)` (`src/db/sql-mgr/v2/SqlMgrv2.ts`). Hàm này lấy `SqlClient` theo dialect (`src/db/sql-client/lib/SqlClientFactory.ts` → `pg/PgClient.ts`, `mysql/MysqlClient.ts`, `sqlite/SqliteClient.ts`…) rồi gọi `sqlClient[op](args)`, với op là `tableCreate`, `tableUpdate` (diff cột thành `alterTableAddColumn` / `alterTableChangeColumn` / `alterTableRemoveColumn`, `PgClient.ts` ~2559), `tableRename`, `tableDelete`. Mọi thứ dựng trên **Knex**.
- Đổi kiểu cột có nhiều xử lý riêng cho từng dialect bằng raw SQL, ví dụ chuyển MultiSelect→SingleSelect bằng `split_part`, drop enum type PG (`src/services/columns.service.ts` ~1556, ~2350–2470). File này dài ~10k dòng.
- **System columns** mặc định khi tạo bảng (`nocodb-sdk/src/lib/sqlUi/PgUi.ts` ~100–260, `helpers/columnHelpers.ts: TableSystemColumns`): `id` (ID), `title` (SingleLineText, display value), `created_at`, `updated_at`, `created_by`, `updated_by`, `nc_order` (Order, numeric, dùng cho thứ tự kéo thả), `__nc_deleted` (cờ soft-delete).
- **DB ngoài có sẵn**:
  - NocoDB introspect qua `sqlClient.tableList/columnList/relationList`, sinh meta từ schema thật.
  - Khi schema bên ngoài thay đổi, `MetaDiffsService.getMetaDiff` (`src/services/meta-diffs.service.ts`) so sánh DB thật với meta rồi "sync".
  - FK có sẵn trong DB được nhận diện thành LTAR (`hm`/`bt`). Bảng chỉ gồm 2 FK được đánh dấu `mm=true`.
  - `is_schema_readonly` chặn DDL lên DB khách.

### 4. UITypes và kiểu SQL (`nocodb-sdk/src/lib/UITypes.ts`, `PgUi.getDataTypeForUiType` ~1872)
- Bảng mapping trên PG: SingleLineText/LongText/URL/Attachment/MultiSelect/SingleSelect/GeoData → `text`; Email/Phone/Collaborator/Barcode → `varchar`; Checkbox → `bool`; Number → `bigint`; Decimal/Currency/Duration → `decimal`; Percent → `double precision`; Rating → `smallint`; Date/Time/DateTime → `date/time/timestamp`; Year → `int`; JSON → `json`; AutoNumber/Count → `int8`; Order → `numeric`; UUID → `uuid`; ID → `int4` autoincrement (hoặc `varchar` khi dùng auto-gen id).
- **Virtual columns** (`isVirtualCol`, UITypes.ts ~374): LinkToAnotherRecord, Links, Formula, Rollup, Lookup, QrCode, Barcode, CreatedTime/LastModifiedTime/CreatedBy/LastModifiedBy (khi map lên system col). Những cột này **không có cột SQL riêng** mà được tính lúc query.
- **LinkToAnotherRecord / Links** (`ColumnsService.createLTARColumn`, `columns.service.ts` ~6988; `helpers/columnHelpers.ts`: `createHmAndBtColumn`, `createOOColumn`; enum `RelationTypes` hm/bt/mm/oo/om/mo):
  - `hm`/`bt`: thêm cột FK (uidt `ForeignKey`) vào bảng child. Source xcdb/snowflake đặt `virtual=true`, tức **không tạo FK constraint** thật.
  - `mm`: tạo bảng junction `${prefix}_nc_m2m_<rand>` (`columns.service.ts` ~480) có 2 cột FK, đồng thời tạo cặp cột LTAR hai chiều.
  - `oo`: là một FK, có cờ `meta.bt` để biết phía nào giữ FK.
  - **Links V2** (`LinksVersion.V2`): mọi relation, kể cả om/mo/oo tạo qua LTAR, đều dùng junction table ("isMMLike"). Đây là thay đổi thiết kế mới, giúp schema đồng nhất và không phải ALTER bảng con.
  - Có hỗ trợ cross-base link (`ref_base_id`, `nc_079_cross_base_link.ts`).
  - Uidt `Links` hiển thị **số lượng** liên kết bằng subquery rollup count (`db/BaseModelSqlv2/select-object.ts` ~623 → `db/genRollupSelectv2.ts`).
- **Lookup**: correlated subquery đi theo relation (`db/generateLookupSelectQuery.ts`), có thể lồng nhiều tầng (`travelLookupColumn`).
- **Rollup**: `genRollupSelectv2.ts` sinh subquery `count/sum/avg/min/max/countDistinct…` theo `rollup_function` trên bảng child/junction.
- **Formula**: parse bằng `nc-jsep` + plugin (`nocodb-sdk/src/lib/formula/jsepInstances.ts`), validate type trong `validate-extract-tree.ts`, lưu `parsed_tree`. Backend dịch AST thành SQL trong `db/formulav2/formulaQueryBuilderv2.ts` + `parsed-tree-builder.ts` (callExpression/binaryExpression). Hàm được map theo dialect qua `db/mapFunctionName.ts` → `db/functionMappings/{pg,mysql,sqlite,mssql,oracle,databricks}.ts`. Formula được tham chiếu Lookup/Rollup/LTAR (`lookup-or-ltar-builder.ts`). Lỗi được persist vào cột `error`.
- **AutoNumber** là cột `int8` auto-increment. **Attachment** là JSON (mảng `{url|path, title, mimetype, size}`) lưu trong cột `text`. File đi qua storage plugin (`src/plugins/{s3,gcs,minio,r2,backblaze,…}`, `NcPluginMgrv2.storageAdapter()` trong `services/attachments.service.ts`), còn reference được track ở `nc_file_references` (`models/FileReference.ts`: `storage`, `file_url`, `fk_model_id`, `fk_column_id`, `fk_row_id`).
- Logic filter/serialize riêng cho từng loại field nằm ở **FieldHandler** per uidt per dialect: `db/field-handler/handlers/<type>/*.ts` (`generic.pg.ts`, `generic.mysql.ts`…).

### 5. Views, filter, sort, phân trang, group
- Filter/sort được lưu dạng row meta gắn với view (mục 2). Khi query, `BaseModelSqlv2.list()` (`db/BaseModelSqlv2.ts` ~844, file ~10.9k dòng) gọi `applySortAndFilter` (~1554) để gộp filter của view, filter `where` từ query string và filter nested.
- `where` dạng `(field,op,value)~and(...)` được parse bằng lexer/CST parser `nocodb-sdk/src/lib/parser/queryFilter/query-filter-parser.ts`.
- `db/conditionV2.ts` dịch đệ quy cây filter thành Knex: group thành `qb.where(fn)` với `getLogicalOpMethod`; filter trên LTAR thành `whereIn/whereNotIn(subquery)` (`field-handler/handlers/ltar/ltar.general.handler.ts` ~221); filter trên Lookup/Rollup/Formula ép theo `result_uidt` hoặc `getEquivalentUIType`; filter động dùng `resolveDynamicFilterValue`. Sort được dịch ở `db/sortV2.ts`.
- Phân trang dùng **offset/limit** (`helpers/dbHelpers.ts: applyPaginate`), mặc định 25. Giới hạn đặt bằng `NC_DB_QUERY_LIMIT_DEFAULT/MIN/MAX` (`helpers/extractLimitAndOffset.ts`). FE grid tải từng chunk 50 dòng theo offset (`nc-gui/composables/useInfiniteData.ts`, `CHUNK_SIZE = 50`, `cachedRows: Map<index,row>`).
- Group by: `BaseModelSqlv2.groupBy/groupByAndAggregate` + `db/BaseModelSqlv2/group-by.ts`. FE có `useInfiniteGroups.ts`. Kanban thực chất là group theo `fk_grp_col_id` (SingleSelect). Calendar/timeline query theo range cột ngày (`services/calendar-datas.service.ts`).

### 6. API
- **v1** (legacy): `/api/v1/db/data/:orgs/:baseName/:tableName[/views/:viewName]` (`controllers/data-alias.controller.ts`).
- **v2**: `/api/v2/tables/:modelId/records` (`controllers/data-table.controller.ts`), gọi theo ID thay vì tên.
- **v3**: `/api/v3/data/:baseName/:modelId/records`, kèm `/records/upsert` và `/links/:columnId/:rowId` (`controllers/v3/data-v3.controller.ts`, `constants/controllers.ts`). Response có dạng `{ records: [{ id, fields }], next, prev }` (`services/v3/data-v3.service.ts`). Meta v3 có `tables-v3`, `columns-v3`, `filters-v3`, `sorts-v3`.
- **Swagger sinh động cho từng base** từ meta: `/api/v{1,2,3}/meta/bases/:baseId/swagger.json` + `/swagger` + `/redoc` (`controllers/api-docs/api-docs.controller.ts`; `services/api-docs/swaggerV2/getPaths.ts`, `getSchemas.ts`, `getSwaggerColumnMetas.ts`, có `swaggerV3/`).
- Auth: header `xc-auth` (JWT session, `guards/global/global.guard.ts`) hoặc `xc-token` / `Authorization: Bearer` (API token, `strategies/authtoken.strategy/authtoken.strategy.ts`). `nc_api_tokens` (`models/ApiToken.ts`) có `fk_user_id`, `permissions`, `expiry`, `enabled`, tức token kế thừa role của user. Mỗi route khai báo `@Acl('dataList')`…
- **Webhooks** (`models/Hook.ts`: `event`, `operation`, `url`, `headers`, `condition`, `retries`, `retry_interval`, `timeout`, `version` v1/v2/v3, `trigger_fields`; filter điều kiện dùng chung `nc_filter_exp_v2.fk_hook_id`):
  - `BaseModelSqlv2` gọi `handleHooks('before.insert' | 'after.bulkUpdate' …)`.
  - `HookHandlerService.handleHooks` đẩy job `JobTypes.HandleWebhook` vào queue (`services/hook-handler.service.ts` ~182).
  - `helpers/webhookHelpers.ts: invokeWebhook` thực hiện gọi. Log ghi vào `nc_hook_logs_v2`.

### 7. Realtime, audit, undo
- **Trong CE, realtime/undo chỉ là stub**:
  - `src/socket/NocoSocket.ts` gồm các hàm `broadcastDataEvent`, `broadcastEventToBaseUsers`… đều rỗng. `NocoPresence.ts` cũng rỗng.
  - `gateways/socket.gateway.ts` (socket.io + `RedisIoAdapter.ts`) hiện chỉ nhận telemetry `page`/`event`.
  - Ở FE, `composables/useRealtime.ts` trả `{}`, `useUndoRedo.ts` có `undo = () => {}` với comment "CE has no undo".
  - Kết luận: kiến trúc đã chừa sẵn hook (broadcast theo base/workspace/user, presence trên grid `useGridFocusPresence.ts`), còn implementation nằm trong EE.
- **Audit**:
  - Lưu ở `nc_audit_v2` (`models/Audit.ts`: `fk_user_id`, `ip`, `user_agent`, `base_id`, `fk_model_id`, `row_id`, `op_type`, `details`, `version`, `fk_parent_id`). Có thể tách DB riêng qua `meta/audit.service.ts` + `migrations/audit/`.
  - Data audit (`AuditV1OperationTypes.DATA_INSERT/DATA_UPDATE…`, `nocodb-sdk/src/lib/audit/v1.ts`) được ghi ngay trong `BaseModelSqlv2` (~5695, ~6042), lưu diff cũ/mới theo field. Tắt bằng `NC_DISABLE_AUDIT=true` (`helpers/dbHelpers.ts` ~359).
  - Comment trên record lưu ở `nc_comments` (`row_id`, `fk_model_id`).

### 8. Phân quyền
- Role nằm ở `nocodb-sdk/src/lib/enums.ts`:
  - `OrgUserRoles`: `super` (các role org khác đã deprecated);
  - `WorkspaceUserRoles`: `workspace-level-{owner,creator,editor,commenter,viewer,no-access,inherit}`;
  - `ProjectRoles` (base): `owner, creator, editor, commenter, viewer, no-access, inherit`, cùng `APP_USER`.
- Ma trận quyền nằm ở `src/utils/acl.ts` → `rolePermissions`. Mỗi role là `{include: {permName: true}}` (whitelist) hoặc `{exclude: …}` (blacklist), với tên permission trùng tên handler (`dataInsert`, `dataUpdate`, `baseInviteLinkCreate`…). Viewer/Commenter/Editor dùng include, Creator/Owner dùng exclude (Creator bị loại `baseDelete`, `migrateBase`). `sourceRestrictions` áp thêm hạn chế khi source readonly.
- Thực thi: `AclMiddleware` (`middlewares/extract-ids/extract-ids.middleware.ts` ~1110) lấy id từ request, load `base_roles`/`workspace_roles` của user (`nc_base_users_v2`, `workspace_user`) rồi so với permission khai báo bằng `@Acl(...)`. Role `inherit` nghĩa là lấy role từ workspace.
- Ẩn bảng theo role: `nc_disabled_models_for_role_v2` (`models/ModelRoleVisibility.ts`). EE có thêm RLS (`fk_rls_policy_id` trong filter) và field/table permission (`nc_permissions`, `nc_permission_subjects`).

### 9. Takeaways cho "Active Tables"
**Điểm nên học:**
1. Tách **meta DB** khỏi **data source**. Bảng user là bảng SQL thật nên index, query và join đều tận dụng DB engine, đồng thời mở được DB có sẵn của khách (introspect + meta-diff).
2. Tách `uidt` (ngữ nghĩa UI) khỏi `dt` (kiểu vật lý) và gom mapping per dialect vào một chỗ (`sqlUi/*Ui.ts`), dùng chung cho FE và BE qua SDK.
3. "colOptions" là bảng riêng cho từng loại cột phức tạp (relations, lookup, rollup, formula, select options), nhờ vậy `nc_columns` giữ được gọn.
4. Một bảng filter dạng cây (`fk_parent_id` + `is_group`), dùng chung cho view, webhook, link-scope, row color và RLS. Rất đáng copy ý tưởng này.
5. Computed field (Lookup/Rollup/Formula/Links count) được **tính lúc query** bằng subquery, nên không có dữ liệu stale và không cần job recompute.
6. Links V2 dùng junction table cho mọi loại relation, nên đổi cardinality không cần ALTER bảng con.
7. Swagger tự sinh theo base từ meta, API token thừa kế role user, webhook chạy qua job queue có retry và log.
8. Grid canvas cùng chunk cache theo index chịu được bảng lớn ở FE.

**Điểm đau:**
1. DDL thật mỗi lần sửa schema: đổi kiểu cột phải chuyển đổi dữ liệu per dialect (`columns.service.ts` ~10k dòng), dễ lỗi và phải lock bảng. Với SaaS nhiều tenant thì DB phình ra hàng nghìn bảng.
2. Hỗ trợ 6+ dialect làm code phình to: formula mapping, FieldHandler và SqlClient đều phải viết cho từng dialect. Nên chọn **một dialect (PostgreSQL)** ngay từ đầu.
3. Computed lúc query tạo ra correlated subquery lồng nhau (lookup của lookup, formula trên rollup). Khi sort/filter trên các field này với bảng lớn thì rất chậm. Cần tính đến materialize/cache cho các field nóng.
4. Phân trang offset/limit sẽ chậm và lệch dòng khi có insert đồng thời. Nên dùng keyset/cursor cho API, và dùng `nc_order` (numeric) cho thứ tự thủ công.
5. Lịch sử đổi tên `project`→`base`, `base`→`source` cùng ba thế hệ API v1/v2/v3 để lại nhiều nợ tương thích. Nên chốt naming và định dạng API (`{id, fields}` như v3) từ đầu.
6. `BaseModelSqlv2.ts` khoảng 10.9k dòng là god object. Nên chia sớm query builder, mutation, hooks và audit thành các module riêng.
7. Realtime, undo và presence không có trong CE nên không có implementation để tham khảo. Cần tự thiết kế event bus (broadcast theo base/table/view room, kèm Redis adapter) cùng undo stack phía client.


---

## APITable

> Nguồn: `git clone --depth 1 https://github.com/apitable/apitable` (AGPL-3.0). Mọi path bên dưới tương đối với root repo đó. Tất cả đều lấy từ code đã đọc, không đoán.

### 1. Kiến trúc tổng thể

| Thành phần | Công nghệ | Vai trò | Bằng chứng |
|---|---|---|---|
| `backend-server` | Java / Spring (Gradle) | Phần "workbench": user, space, org/unit, node tree, quyền (control/role), template, widget, automation metadata, `/api/*` | `backend-server/application/src/main/java/com/apitable/{workspace,control,organization,space,automation,...}`, `gateway/conf.d/server/backend-server.conf` (`location /api`) |
| `room-server` | NestJS (TypeScript) | Engine dữ liệu: OT changeset, ghi record/meta, Fusion API `/fusion/v1,v2`, automation runtime, gRPC | `packages/room-server/src/{database,fusion,automation,socket,grpc}`, `gateway/conf.d/server/room.conf` |
| socket server | cùng code room-server, chạy mode socket (`ENABLE_SOCKET=true`) | Socket.IO `/room`, `/notification`; gọi room-server qua gRPC rồi broadcast | `packages/room-server/src/socket/services/room/room.service.ts` (`roomChange` -> `nestClient.roomChange` -> `broadcastServerChange`), `socket/adapter/redis/redis-io.adapter.ts` |
| `web-server` / `packages/datasheet` | React + Redux | UI; chạy **cùng core engine** với server | `packages/datasheet/src` |
| `packages/core` | TS, dùng chung client và server | Model field, view derivation, formula parser, command manager, OT (JOT), undo, DataBus | `packages/core/src/{model,formula_parser,command_manager,engine/ot,compute_manager,databus}` |
| `databus-server` + `databus-wasm` | Rust (chỉ có binary/image trong repo này) | Lớp data access mới thay cho API cũ: `getDatasheetPack`... | `docker-compose.yaml` (service `databus-server`, port 8625), `packages/databus-wasm/databus_wasm_bg.wasm`, `packages/databus-client/api.ts`, `packages/core/src/modules/database/api/datasheet_api.ts` ("deprecated... Use databus-wasm instead") |
| Hạ tầng | MySQL, Redis, RabbitMQ, MinIO, Nginx gateway | | `docker-compose.yaml`; schema qua Liquibase ở `init-db/src/main/resources/db/changelog/**` |

Redis dùng làm distributed lock cho từng resource khi apply changeset (`RedisLock` trong `packages/room-server/src/database/ot/services/ot.service.ts`) và làm adapter Socket.IO. RabbitMQ có các exchange `apitable.notification.exchange` và `apitable.automation.exchange` (`packages/room-server/src/shared/services/queue/queue.module.ts`).

### 2. Data model: JSON snapshot, không có cột SQL thật

DDL nằm ở `init-db/src/main/resources/db/changelog/0.2/create_datasheet_table.xml`:
- `datasheet`: `dst_id`, `node_id`, `space_id`, `revision`. Chỉ là header.
- `datasheet_meta`: **`meta_data json`** + `revision`. Toàn bộ schema của bảng (fields, views) nằm trong một JSON duy nhất.
- `datasheet_record`: mỗi row một record, `record_id`, `dst_id`, **`data json`** (map `fieldId -> cellValue`), `revision`, `revision_history`. Có unique `(dst_id, record_id)`. Sau này thêm `field_updated_info json` (về sau đổi thành `record_meta`), `created_by`, `updated_by` (`0.5/20200623_changeset.xml`, `0.5/20200820_changeset.xml`).
- `datasheet_changeset`: `message_id`, `member_id`, **`operations longtext`** (JOT actions), `revision`. Đây là log OT.
- `datasheet_operation` (`actions json`, `type 1:JOT,2:COT`); về sau thêm `datasheet_record_archive` (`1.3/20231017_changeset.xml`), `datasheet_record_comment`, `datasheet_changeset_source`, `resource_meta` và `resource_changeset` (cho form/dashboard/widget).

Kiểu TS tương ứng ở `packages/core/src/modules/database/store/interfaces/resource/datasheet/datasheet.ts`:
`ISnapshot { meta: IMeta; recordMap: IRecordMap; datasheetId }`, `IMeta { fieldMap; views: IViewProperty[]; widgetPanels?; archivedRecordIds? }`, `IRecord { id; data: {[fieldId]: ICellValue}; recordMeta: { fieldUpdatedMap, createdAt... } }`.
Khi load, server ghép `datasheet_meta.meta_data` với các row `datasheet_record` thành một "datasheet pack" (`snapshot` + `foreignDatasheetMap` + `units` + `fieldPermissionMap`), xem `packages/room-server/src/database/datasheet/services/datasheet.service.ts` (`fetchDataPack`, khoảng dòng 122-152).

Khi ghi một cell, server dùng `JSON_SET(data, '$.fld..', CAST(? AS JSON))` hoặc `JSON_REMOVE` trên `datasheet_record.data`. Khi ghi meta, server load JSON meta, chạy `jot.apply({meta}, metaActions)` rồi ghi đè cả cột (`packages/room-server/src/database/ot/services/datasheet.ot.service.ts`, ~dòng 2003-2040 và `handleMeta` ~2597-2629).

### 3. Field types

- Enum `FieldType` ở `packages/core/src/types/field_types.ts:699`: Text, Number, SingleSelect, MultiSelect, DateTime, Attachment, Link(7), URL, Email, Phone, Checkbox, Rating, Member, LookUp(14), Formula(16), Currency, Percent, SingleText, AutoNumber(20), CreatedTime, LastModifiedTime, CreatedBy, LastModifiedBy, Cascader, OneWayLink(26), WorkDoc, Button, DeniedField(999, dùng cho cột không có quyền). RollUp(15) bị comment out vì đã gộp vào LookUp qua `rollUpType`. `readonlyFields` liệt kê các field tính toán.
- Mỗi field type là một class trong `packages/core/src/model/field/*.ts` (`Field` base trong `field.ts`, `LinkField`, `LookUpField`, `FormulaField`, `AutoNumberField`...). Mỗi class có `static propertySchema` (Joi) để validate, `defaultProperty()`, compare/sort, stringify, validate cell value. Room-server có bộ transformer/validator riêng cho API ở `packages/room-server/src/fusion/field/*.field.ts`.
- **Link hai chiều**: `ILinkFieldProperty { foreignDatasheetId, brotherFieldId?, limitToView?, limitSingleRecord? }`. Cell lưu mảng recordId ở **cả hai** bảng. Khi sửa một bên, command manager sinh thêm `linkedActions` cho bảng kia, thông qua `LinkIntegrityChecker` và `LinkedDataConformanceMaintainer` (`packages/core/src/command_manager/command_manager.ts:194-251`, `packages/core/src/model/linked_data_conformance_maintainer.ts`). `OneWayLink` không có brother field.
- **LookUp**: `ILookUpProperty { relatedLinkFieldId, lookUpTargetFieldId, rollUpType?, filterInfo?, sortInfo?, lookUpLimit? }`.
- **Formula**: `IFormulaProperty { datasheetId, expression }`. Parser tự viết gồm lexer, parser, interpreter, functions (`packages/core/src/formula_parser/`).
- **Giá trị tính toán không được lưu**: `getComputeCellValue` (`packages/core/src/modules/database/store/selectors/resource/datasheet/cell_calc.ts:185`) tính Formula, LookUp, CreatedBy/Time, AutoNumber lúc đọc, có cache qua `packages/core/src/compute_manager/compute_cache_manager.ts` và `compute_reference_manager.ts` (đồ thị phụ thuộc). Vì core được dùng chung, các giá trị này được tính **cả trên client lẫn trên server** (Fusion API).
- **AutoNumber**: `IAutoNumberFieldProperty { nextId, viewIdx }` lưu trong meta. Số của từng record nằm ở `recordMeta.fieldUpdatedMap[fieldId].autoNumber`.

### 4. Views

- `ViewType`: Grid=1, Kanban=2, Gallery=3, Form=4, Calendar=5, Gantt=6, OrgChart=7, tức "architecture" (`packages/core/src/modules/shared/store/constants.ts:292`). Form ngoài ra còn là một node riêng (`NodeType.FORM`).
- `IViewPropertyBase { id, name, type, rows: IViewRow[], columns: IViewColumn[], filterInfo?, sortInfo?, lockInfo?, autoSave?, hidden? }`. Subtype thêm `frozenColumnCount`, `groupInfo`, `columnGroups`, `rowHeightLevel`, style cho kanban/gantt/calendar. Hidden column là `columns[i].hidden`, độ rộng là `columns[i].width` (cùng file `datasheet.ts`, ~dòng 619-720). `IFilterInfo { conjunction, conditions[] }` ở `packages/core/src/types/view_types.ts:233`.
- **Điểm then chốt**: mỗi view lưu **thứ tự row tường minh** (`rows: [{recordId}]`) **bên trong meta JSON**. Vì vậy thêm hoặc xoá record đều kéo theo sửa `views[*].rows` của mọi view (xem các nhánh "View property changes caused by record creation/deletion/movement" ở `datasheet.ot.service.ts` ~dòng 994-1008).
- **Filter, sort, group chạy hoàn toàn trong bộ nhớ (JS)**: `ViewDerivateBase` lọc `view.rows` qua `ViewFilterDerivate.getFilteredRows`, rồi sort, rồi group (`packages/core/src/compute_manager/view_derivate/view_derivate_base.ts:116-128`, `slice/view_filter_derivate.ts`, thêm các file con cho grid/kanban/gantt/calendar/gallery/org_chart). Fusion API cũng load **toàn bộ datasheet** qua DataBus rồi chạy `filter.getVisibleRows(filterByFormula, view, state)`. Khi filter phức tạp vượt ngưỡng, việc này được đẩy sang worker thread Piscina (`packages/room-server/src/fusion/services/fusion.api.service.ts:216-266`, `packages/room-server/src/fusion/filter/fusion.api.filter.ts`, `ROW_FILTER_OFFLOAD_COMPLEXITY_THRESHOLD`).
- Đánh đổi: tương tác UI rất nhanh (mọi thứ đã có trong RAM, filter và formula phản hồi tức thì), nhưng bộ nhớ và độ trễ tăng tuyến tính theo số record. Không dùng được index SQL. Có hạn mức `datasheet_record_limit` / `space_record_limit` (`datasheet.ot.service.ts` ~dòng 417-442), và tính năng archive record để giảm kích thước snapshot.

### 5. Collaboration (OT)

- Action ở dạng json0 (JOT), path tính trên snapshot: `OTActionName` = `OI/OD/OR` (object), `LI/LD/LR/LM` (list), `NA`, `TI/TD` (`packages/core/src/engine/ot/interface.ts`). Ví dụ path `['recordMap', recordId, 'data', fieldId]` hoặc `['meta','views',i,'rows',j]`.
- Cấu trúc: `IOperation { cmd, actions[] }` nằm trong `IChangeset { messageId, resourceType, resourceId, operations }`. Client gửi `ILocalChangeset { baseRevision }`, server trả về `IRemoteChangeset { revision, userId }`.
- Command cấp cao trong `packages/core/src/commands/datasheet/*.ts` (enum `CollaCommandName` ở `commands/enum.ts`: AddRecords, SetRecords, AddFields, SetFieldAttr, SetViewFilter, SetGroup, MoveRow...). Command sinh JOT actions thông qua `packages/core/src/commands_actions/datasheet.ts` (ví dụ `setRecord2Action`).
- Luồng phía server (`OtService.applyRoomChangeset`, `ot.service.ts:234-330`):
  1. Lấy Redis lock theo resourceId, timeout 120s.
  2. `parseChanges` kiểm tra quyền node và field.
  3. Hàm `transform` so `baseRevision` với revision trong DB. Nếu client bị chậm thì đọc các changeset chênh lệch từ `datasheet_changeset` rồi transform. Giới hạn bởi `MAX_REVISION_DIFF` (mặc định 100, `database/ot/interfaces/ot.interface.ts:26`) và `transformLimit`; vượt giới hạn thì trả lỗi `REVISION_OVER_LIMIT` để client tự xử lý.
  4. `DatasheetOtService.analyseOperates` gom actions thành `resultSet` (`toCreateRecord`, `replaceCellMap`, `toDeleteRecordIds`, `metaActions`...).
  5. Ghi tất cả resource trong **một transaction MySQL**: record, meta, changeset, revision.
  6. Socket server broadcast `SERVER_ROOM_CHANGE` / `NEW_CHANGES` cho room (`packages/core/src/sync/readme.md`, `socket/services/room/room.service.ts:215`).
  7. Event robot (automation) chạy async.
- Room theo trang: mở bảng A có link tới B và C thì client join luôn room của B và C (`packages/core/src/sync/readme.md`).
- Undo/redo chạy ở client: `UndoManager` giữ stack 50 command, undo bằng `jot.invert(actions)` và có transform với các changeset remote (`packages/core/src/command_manager/undo_manager.ts`). Rollback snapshot về một revision cũ là command `Rollback`, kết hợp time machine (`/fusion/v1/timemachine/:dstId`).

### 6. API, token, widget SDK, automation

- Fusion API (NestJS) có `@Controller('/fusion/v1')` và `/fusion/v2`, guard `ApiAuthGuard, ApiUsageGuard, NodePermissionGuard` (`packages/room-server/src/fusion/fusion.api.controller.ts`, `fusion.api.v2.controller.ts`). Các endpoint: `GET/POST/PATCH/PUT/DELETE /datasheets/:dstId/records` (query `viewId`, `filterByFormula`, `pageSize`, `cellFormat`...), `GET /datasheets/:dstId/fields|views`, `POST/DELETE /spaces/:spaceId/datasheets/:dstId/fields`, `POST /spaces/:spaceId/datasheets`, `GET /spaces/:spaceId/nodes`, attachments, `POST datasheets/:dstId/executeCommand` (chạy thẳng một CollaCommand). Ghi qua API cũng đi đúng đường command, OT, changeset (`fusion.api.service.ts:745 executeCommand`).
- API token: bảng `developer` có cột `api_key` unique (`init-db/.../0.4/20200520_changeset_001.sql`, `0.9/20211115_changeset.xml`). Thống kê qua `api_usage` và `api_statistics_daily/monthly`.
- Widget SDK: `packages/widget-sdk/src` (hooks, model, `view_computed`, store). Widget chạy với cùng core/Redux, cấu hình lưu ở `meta.widgetPanels`, các bảng `widget` và `widget_package*`.
- Automation ("robots"): các bảng `automation_robot/trigger/action/trigger_type/action_type/run_history` (Liquibase). Runtime nằm ở `packages/room-server/src/automation/`: các event `record.created`, `record.updated`, `form.submitted`, `button.clicked`; các action `webhook`, `slack`, `sms`; dùng `@RabbitSubscribe` để chạy qua hàng đợi (`automation/services/automation.service.ts`).

### 7. Permissions

- Workspace là một cây node: bảng `node(parent_id, pre_node_id, type)`. Thứ tự anh em dùng linked list qua `pre_node_id`. `NodeType`: ROOT, FOLDER, DATASHEET, FORM, DASHBOARD, MIRROR, ..., AUTOMATION (`backend-server/.../workspace/enums/NodeType.java`). Mirror là một view được "chiếu" sang node khác (`displayHiddenColumnWithinMirror`).
- Quyền node: ban đầu dùng `node_permission(node_id, unit_id, role_code)`, sau đó tổng quát hoá thành `control(control_id, control_type)` và `control_role(control_id, unit_id, role_code)` (`init-db/.../0.7/20210427_changeset.xml`). `ControlType` gồm `NODE(0)` và `DATASHEET_FIELD(1)`. Control id của field có dạng `dstId + SYMBOL + fieldId` (`control/infrastructure/ControlIdBuilder.java`). Unit có thể là member, team hoặc role. Quyền được kế thừa xuống theo cây.
- Role: Owner, Manager, Editor, Updater, Reader, TemplateVisitor, Anonymous, và FieldEditor/FieldReader (`control/infrastructure/role/*.java`). Quyền là bitmask: `NodePermission` có `MANAGE_NODE`, `EDIT_NODE`, `READ_NODE`, `CREATE_VIEW`, `FILTER_VIEW`, `HIDE_COLUMN`...; `FieldPermission` có `READ_FIELD_DATA`, `EDIT_FIELD_DATA` (`control/infrastructure/permission/`).
- Quyền field được Java tính sẵn thành `fieldPermissionMap` và đưa vào datasheet pack. Client che cột đi (`DeniedField`). Room-server kiểm tra lại quyền khi parse changeset (`ot.service.ts` `getNodeRole`). Socket broadcast `broadcastFieldPermissionChange` khi quyền thay đổi.

### 8. Bài học thiết kế cho "Active Tables"

**Ưu điểm của mô hình JSON snapshot + OT (APITable):**
- Đổi schema rẻ: thêm, xoá hay đổi kiểu field chỉ là sửa `meta.fieldMap`, không cần `ALTER TABLE`. Cell lưu theo `fieldId` (không theo tên) nên đổi tên field không cần migrate.
- Một engine TS (`packages/core`) chạy giống hệt nhau trên client và server, gồm validation, formula, filter, undo. Client có thể áp dụng thay đổi lạc quan (optimistic) ngay, server chỉ xác nhận revision.
- Changeset log (`datasheet_changeset`) đồng thời phục vụ realtime sync, lịch sử, time machine, rollback và audit.

**Nhược điểm (thấy rõ trong code):**
- Mỗi lần đọc phải load toàn bộ datasheet (kèm `foreignDatasheetMap` của các bảng link) vào RAM. Filter, sort, formula và lookup đều O(N) trong JS, nên phải có hạn mức record, worker Piscina, archive.
- `views[*].rows` và cả `meta` là một JSON blob duy nhất. Mọi thao tác thêm hay xoá record đều ghi lại meta, và các thao tác ghi trên một bảng bị tuần tự hoá bằng Redis lock, nên dễ thành hotspot khi nhiều người cùng ghi.
- Không có index SQL hay truy vấn ad-hoc. Báo cáo/BI phải đi qua engine. Link hai chiều phải được giữ nhất quán bằng code (ConformanceMaintainer, lệnh `FixConsistency`), chứ không có FK.
- OT transform giới hạn theo `MAX_REVISION_DIFF`; client lệch quá xa thì phải reload.

**Khuyến nghị cho sản phẩm mới:**
1. Giữ ý tưởng **metadata là JSON** (fields, views, filter/sort/group/hidden columns) cùng một `revision`, vì schema động rất hợp mô hình này. Tuy nhiên **không lưu thứ tự row trong view**. Nên dùng một sort key kiểu fractional index trên record, và chỉ lưu thứ tự thủ công cho view nào thật sự cần.
2. Cho record: hoặc (a) JSONB per-record (Postgres, giống `datasheet_record.data`) kèm GIN/expression index cho các field hay filter, hoặc (b) bảng SQL thật / EAV có kiểu dữ liệu nếu cần filter, sort, phân trang phía server với hàng trăm nghìn row. Nên đẩy filter/sort xuống DB, thay vì làm trong bộ nhớ như APITable.
3. Dùng **command, rồi action, rồi changeset có revision** cho cả UI lẫn REST API (APITable cho REST đi qua `executeCommand`). Nhờ vậy có một đường ghi duy nhất cho audit, undo, realtime và automation. Granularity cell-level (`recordId, fieldId`) thường đủ dùng, và cho phép LWW (last-write-wins) theo cell thay cho OT đầy đủ ở phần record.
4. Field tính toán (formula/lookup/rollup) nên có đồ thị phụ thuộc giống `compute_reference_manager`. Nếu cần filter/sort theo chúng phía server, cân nhắc materialize giá trị (APITable không lưu).
5. Quyền theo hai tầng: cây node có kế thừa (folder rồi tới table/form/dashboard) và control theo field (`dstId+fieldId`), dùng bitmask. Server luôn phải kiểm tra lại mỗi changeset, client chỉ che hiển thị.
