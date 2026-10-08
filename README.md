# Tago Workflow — Admin

Monorepo dùng pnpm + Turborepo.

```
apps/
  admin/                    # Vite + React 19 + TS + Tailwind v4
    src/
      app/                  # bootstrap: providers, router, layouts
      components/           # component dùng chung cấp app (layout, theme)
      config/               # navigation, hằng số
      hooks/  lib/  stores/ # hook, util (format, query-client), store global (zustand)
      pages/                # trang chung (404, coming soon)
      features/
        <feature>/
          api/              # gọi API + TanStack Query (keys, queryOptions, hooks)
          components/       # UI riêng của feature
          data/             # mock data
          hooks/            # logic/hook riêng
          pages/            # page component gắn vào router
          store/            # state UI riêng (zustand)
          types/
          index.ts          # public API — bên ngoài chỉ import từ đây
packages/
  ui/                       # shadcn/ui + globals.css (theme tokens) dùng chung
  typescript-config/
```

## pnpm workspace

- Package khai báo trong `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
- Package nội bộ liên kết bằng `"workspace:*"` (vd. `@workspace/ui`), import theo `exports` của package — không dùng alias.
- Version dùng chung nằm ở `catalog:` trong `pnpm-workspace.yaml`; package.json ghi `"react": "catalog:"`. Nâng version: sửa catalog → `pnpm install`.
- `@workspace/ui` khai báo `react`/`react-dom` là peerDependencies để cả workspace chỉ có 1 bản React.

## Lệnh

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build
pnpm typecheck
pnpm dev:admin                          # chỉ chạy app admin
pnpm --filter admin add <pkg>           # thêm dep cho 1 package
pnpm --filter @workspace/ui add <pkg>
pnpm add -Dw <pkg>                      # dep ở root
pnpm ui:add <component>                 # thêm component shadcn vào packages/ui
```

Sau khi `pnpm ui:add`, kiểm tra import `cn` trỏ về `@workspace/ui/lib/utils`.

Quy tắc: feature không import sâu vào feature khác — chỉ qua `@/features/<name>`.
