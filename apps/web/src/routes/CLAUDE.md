# Web Routes Directory

## 概述

TanStack Router file-based routing with TanStack Start SSR, grouped by route domain with co-located components.

---

## 结构

```
src/routes/
├── (auth)/              # Authenticated routes group
├── (public)/            # Public routes group
├── admin/               # Admin dashboard routes
│   ├── -components/     # Admin-specific shared components
│   ├── dashboard/
│   ├── organizations/
│   └── users/
├── api/                 # API proxy routes
│   ├── auth/
│   └── rpc/             # oRPC endpoint proxy
├── org/                 # Organization member routes
│   ├── -components/     # Org-specific shared components
│   ├── dashboard/
│   ├── members/
│   └── settings/
└── __root.tsx           # Root layout
```

---

## 快速查找

| Task | Location |
|------|----------|
| Route definitions | Each route.tsx file |
| Route groups | (auth)/, (public)/, admin/, org/ |
| Shared components | -components/ subdirs per group |
| Layout components | route.tsx files, __root.tsx |
| API integration | api/rpc/route.tsx |

---

## 规范

### 文件组织

- **Route files**: `route.tsx` - exports route configuration
- **Index files**: `index.tsx` - default route for directory
- **Nested routes**: `$param.tsx` - dynamic route segments
- **Component folders**: `-components/` - route-scoped shared components (dash prefix = not a route)

### 路由模式

每个路由文件从 `createFileRoute` 导出 `Route`：

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboard
})
```

### 组件共置

- 路由特定的组件位于路由相邻的 `-components/` 中
- 命名: TS/JS 文件使用 PascalCase
- 防止跨路由组的命名空间污染

---

## 路由权限矩阵

| 路由组 | 访问规则 | 守卫函数 | 未授权处理 |
|--------|----------|----------|------------|
| `(public)/` | 公开访问 | 无 | - |
| `(auth)/` | 登录后访问 | `requireAuth` | → /login |
| `admin/*` | 仅 Admin | `requireAdminRole` | → /org |
| `org/*` | 登录用户 | `requireAuth` | → /login |
| `invitations/*` | 公开访问 | 无 | - |

---

## 路由分组

**公共页面** (`(public)/`): `/`, `/landing`, `/pricing`, `/about`

**认证流程** (`(auth)/`): `/login` - 支持 `invitationId` 和 `redirect` 参数

**管理员界面** (`admin/`): 仪表板、组织管理、用户管理 - 仅 Admin 可访问

**组织成员界面** (`org/`): 仪表板、成员管理、团队管理、设置 - 所有登录用户可访问

**公开邀请** (`invitations/`): `/invitations/accept/$invitationId` - 公开可访问

---

## 登录后重定向

```typescript
// 优先级顺序
1. redirect 查询参数
2. 用户角色: Admin → /admin/dashboard, User → /org/dashboard
3. 默认: /org/dashboard
```

---

## 组件共置规则

- `-components/` 文件夹不会自动注册为路由（dash 前缀）
- 组件应该与使用它的路由放在同一目录下
- 跨路由组共享的组件 → `src/components/`

---

## 反模式

- **不要在 `src/routes/` 中创建顶级组件** - 使用 -components/ 子目录
- **不要混合路由组** - 保持 admin/ 与 org/ 分离，它们有不同的权限
- **不要重复组件** - 跨组共享的组件移至 `src/components/`
- **不要修改 routeTree.gen.ts** - 由 TanStack Router 自动生成

---

## 独特风格

- **组前缀**: `(auth)`, `(public)` 表示路由组（不是实际 URL）
- **组件隔离**: 每个主要路由域（admin, org）都有自己的 -components/ 文件夹
- **基于文件的路由**: 无需显式路由配置 - 文件结构 = 路由

---

## 注意事项

- 路由组（括号目录）不添加 URL 段
- -components/ 文件夹被路由器忽略，防止自动路由注册
- 使用 `<Link from="...">` 进行类型安全导航

---

## 相关文档

- **路由权限详解**: [docs/route-permissions.md](../../../docs/route-permissions.md)
- **认证流程详解**: [docs/authentication.md](../../../docs/authentication.md)
