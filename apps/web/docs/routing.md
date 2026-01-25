# 路由系统详解

## 概述

本文档详细说明了 TanStack Router 文件系统路由的使用方法、权限控制、数据获取模式以及数据处理的最佳实践。

---

## 文件系统路由

### 路由文件定义

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboard
})

function AdminDashboard() {
  return <div>Admin Dashboard</div>
}
```

### 文件组织规范

| 文件类型 | 命名 | 用途 |
|----------|------|------|
| `route.tsx` | - | 导出路由配置 |
| `index.tsx` | - | 目录的默认路由 |
| `$param.tsx` | `$` 前缀 | 动态路由参数 |
| `-components/` | `-` 前缀 | 路由特定的共享组件（非路由） |

### 目录结构示例

```
src/routes/
├── (public)/        # 公开页面
├── (auth)/          # 认证流程
├── admin/           # 管理端 (Admin 权限)
│   └── -components/ # 管理端共享组件
├── org/             # 组织端 (登录用户)
│   └── -components/ # 组织端共享组件
└── __root.tsx       # 根布局
```

---

## 路由分组与权限矩阵

### 权限矩阵

| 路由组 | 访问规则 | 守卫函数 | 未授权处理 |
|--------|----------|----------|------------|
| `(public)/` | 公开访问 | 无 | - |
| `(auth)/` | 登录后访问 | `requireSession` | → /sign-in |
| `admin/*` | 仅 Admin | `requireAdmin` | → /org/dashboard |
| `org/*` | 有活跃组织 | `requireActiveOrg` | → /org/create |

### 路由分组说明

- **`(public)/`**: 公开页面 (`/`, `/landing`, `/pricing`, `/about`)
- **`(auth)/`**: 认证流程 (`/sign-in` - 支持 `invitationId` 和 `redirect` 参数)
- **`admin/`**: 管理员界面（仪表板、组织管理、用户管理）
- **`org/`**: 组织成员界面（仪表板、成员管理、团队管理、设置）

### 登录后重定向优先级

1. `redirect` 查询参数
2. 用户角色: Admin → `/admin/dashboard`, User → `/org/dashboard`
3. 默认: `/org/dashboard`

---

## 路由守卫

### 守卫函数使用

```typescript
import { requireSession, requireActiveOrg, requireAdmin } from '@/utils/route-guards'

// 要求已登录
export const Route = createFileRoute('/profile')({
  beforeLoad: requireSession,
  component: Profile,
})

// 要求有活跃组织
export const Route = createFileRoute('/org/dashboard/')({
  beforeLoad: requireActiveOrg,
  component: OrgDashboard,
})

// 要求管理员权限
export const Route = createFileRoute('/admin/dashboard/')({
  beforeLoad: requireAdmin,
  component: AdminDashboard,
})
```

### 守卫行为

| 守卫函数 | 条件 | 重定向目标 |
|----------|------|------------|
| `requireSession` | 未登录 | `/sign-in` |
| `requireActiveOrg` | 无活跃组织 | `/org/create` |
| `requireAdmin` | 非 Admin | `/org/dashboard` |

---

## 数据获取模式

### 推荐模式 (TanStack Router + Query 最佳实践)

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { orpc } from '@/utils/orpc'
import { requireActiveOrg } from '@/utils/route-guards'

export const Route = createFileRoute('/org/dashboard/')({
  // 路由级权限守卫
  beforeLoad: requireActiveOrg,

  // 服务端预加载数据
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(orpc.privateData.queryOptions()),
      context.queryClient.ensureQueryData(
        orpc.organization.listMembers.queryOptions({ input: {} })
      ),
    ])
  },

  component: OrgDashboard,
})

function OrgDashboard() {
  // 数据已在缓存中，无 loading 状态检查
  const { data: session } = useSuspenseQuery(orpc.privateData.queryOptions())
  const { data: members } = useSuspenseQuery(
    orpc.organization.listMembers.queryOptions({ input: {} })
  )

  return <div>...</div>
}
```

### oRPC 参数传递规范

```typescript
// ✅ 正确 - oRPC v2 使用 { input: {...} } 包装
orpc.organization.listMembers.queryOptions({ input: {} })

// ❌ 错误（旧方式）
orpc.organization.listMembers.queryOptions()
```

### 查询失效规范

```typescript
// ✅ 推荐 - 使用 .key() 方法
queryClient.invalidateQueries({
  queryKey: orpc.organization.listMembers.key(),
})

// ❌ 不推荐
queryClient.invalidateQueries({
  queryKey: orpc.organization.listMembers.queryOptions({ input: {} }).queryKey,
})
```

---

## 组件共置

### 规范

- 路由特定的组件位于相邻的 `-components/` 中
- 命名: TS/JS 文件使用 PascalCase
- 防止跨路由组的命名空间污染

### 规则

- `-components/` 文件夹不会自动注册为路由（dash 前缀）
- 组件应该与使用它的路由放在同一目录下
- 跨路由组共享的组件 → `src/components/`

---

## 动态路由参数

### 基础动态路由

```typescript
// routes/org/teams/$teamId.tsx
export const Route = createFileRoute('/org/teams/$teamId')({
  component: TeamDetail,
})

function TeamDetail() {
  const { teamId } = Route.useParams()
  // 使用 teamId...
}
```

### 可选动态参数

```typescript
// routes/$lang/index.tsx
export const Route = createFileRoute('/$lang/')({
  component: Home,
})

function Home() {
  const { lang } = Route.useParams()
  // lang 可能为 undefined
}
```

### 路由搜索参数

```typescript
function TeamDetail() {
  const { teamId } = Route.useParams()
  const navigate = useNavigate()

  const handleTabChange = (tab: string) => {
    navigate({
      to: '/org/teams/$teamId',
      params: { teamId },
      search: { tab },
    })
  }
}
```

---

## 相关文档

- **数据加载详解**: [docs/data-loading.md](./data-loading.md)
- **CRUD 模式**: [docs/crud-patterns.md](./crud-patterns.md)
- **UI 交互模式**: [docs/ui-patterns.md](./ui-patterns.md)
- **表单模式**: [docs/form-patterns.md](./form-patterns.md)
- [TanStack Router 文档](https://tanstack.com/router/latest)
