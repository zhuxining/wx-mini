# Web App 开发指南

## 1. 快速开始

### 1.1 目录结构

```
apps/web/src/
├── routes/              # 文件系统路由
│   ├── (public)/        # 公开页面
│   ├── (auth)/          # 认证流程
│   ├── admin/           # 管理端 (Admin 权限)
│   │   └── -components/ # 管理端共享组件
│   ├── org/             # 组织端 (登录用户)
│   │   └── -components/ # 组织端共享组件
│   └── __root.tsx       # 根布局
├── components/          # 全局共享组件
│   └── ui/              # shadcn/ui (DO NOT EDIT)
├── utils/
│   ├── orpc.ts          # oRPC 客户端
│   └── route-guards.ts  # 路由守卫
```

### 1.2 快速索引

| 任务 | 查看章节 |
|------|----------|
| 添加新路由 | → 2. 路由架构 |
| 权限控制 | → 2.3 路由守卫 |
| 数据获取 | → 2.4 数据获取模式 |
| CRUD 页面 | → 3.3 CRUD 模式 |
| 添加 UI 组件 | → 3.2 shadcn/ui 规范 |

---

## 2. 路由架构

### 2.1 文件系统路由

TanStack Router 使用基于文件的路由系统。

**路由文件定义**:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboard
})
```

**文件组织规范**:

- `route.tsx` - 导出路由配置
- `index.tsx` - 目录的默认路由
- `$param.tsx` - 动态路由参数
- `-components/` - 路由特定的共享组件（非路由）

### 2.2 路由分组与权限矩阵

| 路由组 | 访问规则 | 守卫函数 | 未授权处理 |
|--------|----------|----------|------------|
| `(public)/` | 公开访问 | 无 | - |
| `(auth)/` | 登录后访问 | `requireSession` | → /sign-in |
| `admin/*` | 仅 Admin | `requireAdmin` | → /org/dashboard |
| `org/*` | 有活跃组织 | `requireActiveOrg` | → /org/create |

**路由分组说明**:

- **`(public)/`**: 公开页面 (`/`, `/landing`, `/pricing`, `/about`)
- **`(auth)/`**: 认证流程 (`/sign-in` - 支持 `invitationId` 和 `redirect` 参数)
- **`admin/`**: 管理员界面（仪表板、组织管理、用户管理）
- **`org/`**: 组织成员界面（仪表板、成员管理、团队管理、设置）

**登录后重定向优先级**:

1. `redirect` 查询参数
2. 用户角色: Admin → `/admin/dashboard`, User → `/org/dashboard`
3. 默认: `/org/dashboard`

### 2.3 路由守卫

使用 `utils/route-guards.ts` 中的守卫函数：

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

**守卫行为**:

| 守卫函数 | 条件 | 重定向目标 |
|----------|------|------------|
| `requireSession` | 未登录 | `/sign-in` |
| `requireActiveOrg` | 无活跃组织 | `/org/create` |
| `requireAdmin` | 非 Admin | `/org/dashboard` |

### 2.4 数据获取模式

**新推荐模式** (TanStack Router + Query 最佳实践):

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

**oRPC 参数传递规范**:

```typescript
// ✅ 正确 - oRPC v2 使用 { input: {...} } 包装
orpc.organization.listMembers.queryOptions({ input: {} })

// ❌ 错误（旧方式）
orpc.organization.listMembers.queryOptions()
```

**查询失效规范**:

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

### 2.5 组件共置

**规范**:

- 路由特定的组件位于相邻的 `-components/` 中
- 命名: TS/JS 文件使用 PascalCase
- 防止跨路由组的命名空间污染

**规则**:

- `-components/` 文件夹不会自动注册为路由（dash 前缀）
- 组件应该与使用它的路由放在同一目录下
- 跨路由组共享的组件 → `src/components/`

---

## 3. 组件开发

### 3.1 目录结构

```
src/components/
├── ui/                   # shadcn/ui (auto-generated, DO NOT EDIT)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
├── loader.tsx            # Loading spinner
├── sign-in-form.tsx      # Login form
├── sign-up-form.tsx      # Registration form
├── user-menu.tsx         # User dropdown
├── nav-user.tsx          # User navigation
└── nav-main.tsx          # Main navigation
```

### 3.2 shadcn/ui 规范

**不要编辑 `ui/` 目录中的文件** - 这些文件由 shadcn CLI 自动生成。

**添加新 UI 组件**:

```bash
bunx shadcn@latest add [component-name]
```

**已使用的 shadcn/ui 组件**:

- `button`, `card`, `input`, `label`, `select`
- `dialog`, `sheet`, `sidebar`, `collapsible`
- `table`, `breadcrumb`, `separator`
- `avatar`, `badge`, `tooltip`, `dropdown-menu`
- `skeleton` (loading states)
- `sonner` (toast notifications)

### 3.3 CRUD 页面模式

**关键要点**:

- 使用 `useSuspenseQuery` 获取数据（已通过 loader 预取）
- 使用 `useMutation` 执行变更
- 成功后使用 `invalidateQueries` 刷新数据
- 使用 `toast` (Sonner) 显示操作结果

```typescript
function MembersList() {
  const queryClient = useQueryClient()
  const { data: members } = useSuspenseQuery(
    orpc.organization.listMembers.queryOptions({ input: {} })
  )

  const removeMember = useMutation({
    ...orpc.organization.removeMember.mutationOptions(),
    onSuccess: () => {
      toast.success("Member removed")
      queryClient.invalidateQueries({
        queryKey: orpc.organization.listMembers.key(),
      })
    },
  })

  return (
    <div>
      {members.map(member => (
        <div key={member.id}>
          {member.name}
          <button onClick={() => removeMember.mutate({ memberId: member.id })}>
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
```

### 3.4 表单模式

- 使用 `@tanstack/react-form` 管理表单状态
- 使用 `zod` 定义验证规则
- 使用 `form.Field` 渲染表单字段
- 禁用提交按钮：`!state.canSubmit || state.isSubmitting`

### 3.5 Toast/对话框模式

**Toast 通知**:

- 使用 `toast.success()`, `toast.error()`, `toast.info()`
- 支持带操作的通知
- 支持 Promise 状态自动处理

**对话框**:

- 使用 `Dialog`, `DialogContent`, `DialogTrigger` 组件
- 支持创建/编辑对话框和删除确认对话框

---

## 4. 代码规范

### 4.1 反模式

**路由相关**:

- 不要在 `src/routes/` 中创建顶级组件 - 使用 `-components/` 子目录
- 不要混合路由组 - 保持 `admin/` 与 `org/` 分离
- 不要修改 `routeTree.gen.ts` - 由 TanStack Router 自动生成

**组件相关**:

- 不要编辑 `ui/*.tsx` 文件 - 使用 shadcn CLI 重新生成
- 不要混合加载状态 - 使用一致的 Skeleton 或 Loader 模式
- 不要跳过 toast 通知 - 始终为 mutations 提供反馈
- 不要忘记查询失效 - 在 mutations 后刷新数据
- 不要使用内联样式 - 使用 Tailwind 类或 shadcn 组件

### 4.2 导入规范

```typescript
import { orpc } from "@/utils/orpc";  // 内部导入
import { db } from "@org-sass/db";     // 跨包导入
```

### 4.3 文件命名

- 路由文件: `route.tsx`, `index.tsx`, `$param.tsx`
- 组件文件: PascalCase (`UserProfile.tsx`)
- 工具文件: camelCase (`route-guards.ts`)
- 组件目录: `-components/` (dash 前缀)

---

## 5. 相关文档

- **API 开发**: [packages/api/src/CLAUDE.md](../../packages/api/CLAUDE.md)
- **认证流程**: [packages/auth/src/CLAUDE.md](../../packages/auth/CLAUDE.md)
- **数据库**: [packages/db/src/CLAUDE.md](../../packages/db/CLAUDE.md)
- **shadcn/ui**: [https://ui.shadcn.com/](https://ui.shadcn.com/)
- **TanStack Router**: [https://tanstack.com/router/latest](https://tanstack.com/router/latest)
