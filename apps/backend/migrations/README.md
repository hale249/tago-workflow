SQL migrations (goose). One file per change: `YYYYMMDDHHMMSS_short_name.sql` with `-- +goose Up` / `-- +goose Down`.
Two sets, applied by `tago migrate` in the deploy pipeline — never automatically on production start-up:

- `system/` — the control-plane database `tago` (`tago migrate system`).
- `data/` — every data shard (pooled and dedicated share one schema), canary shard first (`tago migrate shards`).
  Data migrations must be expand/contract: code has to run on schema N and N+1 while the rollout is in progress.
  Every tenant table keeps `workspace_id` as the leading column of its primary key and indexes.

Design and rules (I1–I10): `docs/database-multi-tenant-design.md`.
