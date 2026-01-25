# 路由权限详解

## 概述

本文档详细说明了 TanStack Router 文件系统路由的权限矩阵、分组规则和守卫实现。

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

## 路由分组业务规则

### 公共页面 (`(public)/`)

**目录结构**:

```
routes/(public)/
├── route.tsx                  # 共享布局
├── -components/
│   ├── header.tsx             # 公共页头
│   └── footer.tsx             # 公共页脚
├── index.tsx                  # 首页 (/)
├── landing.tsx                # 落地页 (/landing)
├── pricing.tsx                # 定价页 (/pricing)
└── about.tsx                  # 关于页 (/about)
```

**访问规则**:

- 无需认证即可访问
- 使用共享布局 (header + footer)
- 导航菜单指向登录页面

**共享布局** (`route.tsx`):

```typescript
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "./-components/header";
import { Footer } from "./-components/footer";

export const Route = createFileRoute("/(public)/")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

---

### 认证流程 (`(auth)/`)

**目录结构**:

```
routes/(auth)/
└── login.tsx                  # 登录页 (/login)
```

**访问规则**:

- 公开访问（无需登录）
- 支持 `invitationId` 和 `redirect` 查询参数
- 登录成功后根据角色重定向

**登录页面实现** (`login.tsx`):

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/login")({
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignInForm
        invitationId={search.invitationId}
        redirect={search.redirect}
      />
    </div>
  );
}
```

**查询参数**:

- `invitationId`: 邀请 ID，登录后自动接受邀请
- `redirect`: 登录后重定向路径

---

### 管理员界面 (`admin/`)

**目录结构**:

```
routes/admin/
├── -components/               # Admin 专用组件
│   ├── app-sidebar.tsx        # 管理员侧边栏
│   └── nav-user.tsx           # 用户菜单
├── dashboard/
│   └── index.tsx              # 仪表板 (/admin/dashboard)
├── organizations/
│   ├── index.tsx              # 组织列表 (/admin/organizations)
│   └── $orgId.tsx             # 组织详情 (/admin/organizations/:orgId)
└── users/
    └── index.tsx              # 用户列表 (/admin/users)
```

**访问规则**:

- 仅 Admin 角色可访问
- 路由级守卫检查 `user.role` 包含 `admin`
- 未授权非 Admin 用户重定向到 `/org`

**守卫实现**:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuth, requireAdminRole } from "@/server/auth";

export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: async ({ context }) => {
    const session = await requireAuth({ context });

    // 检查 admin 角色
    requireAdminRole(session);

    return { session };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { session } = Route.useRouteContext();
  return <div>Welcome Admin {session.user.name}</div>;
}
```

**守卫函数** (`server/auth.ts`):

```typescript
export async function requireAuth({ context }: { context: RouterAppContext }) {
  const session = await auth.api.getSession({
    headers: context.req.headers,
  });

  if (!session) {
    throw redirect({
      to: "/login",
      search: { redirect: window.location.href },
    });
  }

  return session;
}

export function requireAdminRole(session: Session) {
  const role = session.user.role;
  if (!role?.includes("admin")) {
    throw redirect({ to: "/org" });
  }
}
```

---

### 组织成员界面 (`org/`)

**目录结构**:

```
routes/org/
├── -components/               # Org 专用组件
│   ├── app-sidebar.tsx        # 组织侧边栏
│   ├── nav-user.tsx           # 用户菜单
│   └── org-switcher.tsx       # 组织切换器
├── dashboard/
│   └── index.tsx              # 仪表板 (/org/dashboard)
├── members/
│   └── index.tsx              # 成员列表 (/org/members)
├── teams/
│   ├── index.tsx              # 团队列表 (/org/teams)
│   └── $teamId.tsx            # 团队详情 (/org/teams/:teamId)
└── settings/
    └── index.tsx              # 组织设置 (/org/settings)
```

**访问规则**:

- 所有登录用户可访问
- 需要有活动组织 (`activeOrganizationId`)
- 根据 `activeOrganizationId` 显示组织数据

**守卫实现**:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireAuth } from "@/server/auth";

export const Route = createFileRoute("/org/dashboard")({
  beforeLoad: async ({ context }) => {
    const session = await requireAuth({ context });

    // 检查是否有活动组织
    const orgId = session?.user?.activeOrganizationId;
    if (!orgId) {
      throw redirect({ to: "/org/select" });
    }

    return { session, orgId };
  },
  component: OrgDashboard,
});
```

**组织切换**:

用户可以通过组织切换器切换 `activeOrganizationId`：

```typescript
import { orpc } from "@/utils/orpc";

const switchOrg = async (orgId: string) => {
  await orpc.organization.setActiveOrganization({
    organizationId: orgId,
  });

  // 刷新页面以更新数据
  window.location.reload();
};
```

---

### 公开邀请 (`invitations/`)

**目录结构**:

```
routes/invitations/
└── accept/
    └── $invitationId.tsx      # 接受邀请页面 (/invitations/accept/:invitationId)
```

**访问规则**:

- 公开可访问（无需登录）
- 显示邀请详情（组织、邀请者、角色）
- 登录后可接受邀请，未登录时跳转到登录页

**实现示例**:

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/invitations/accept/$invitationId")({
  component: AcceptInvitationPage,
  loader: async ({ params }) => {
    // 获取邀请详情
    const invitation = await orpc.organization.getInvitation({
      invitationId: params.invitationId,
    });
    return { invitation };
  },
});

function AcceptInvitationPage() {
  const { invitation } = Route.useLoaderData();
  const session = useSession();

  if (!session) {
    // 未登录，跳转到登录页
    return (
      <div>
        <p>You've been invited to {invitation.organization.name}</p>
        <Link
          to="/login"
          search={{ invitationId: invitation.id }}
        >
          Sign in to accept
        </Link>
      </div>
    );
  }

  // 已登录，显示接受邀请按钮
  return <AcceptInvitationForm invitation={invitation} />;
}
```

---

## 登录后重定向规则

### 优先级顺序

```typescript
// 1. redirect 查询参数 (最高优先级)
if (search.redirect) {
  navigate({ to: search.redirect });
  return;
}

// 2. 根据用户角色
const role = session.user.role;
if (role?.includes("admin")) {
  navigate({ to: "/admin/dashboard" });
} else {
  navigate({ to: "/org/dashboard" });
}

// 3. 默认重定向
navigate({ to: "/org/dashboard" });
```

### 实现位置

**文件**: [apps/web/src/components/sign-in-form.tsx:42-65](../apps/web/src/components/sign-in-form.tsx)

**代码示例**:

```typescript
import { useNavigate } from "@tanstack/react-router";

function SignInForm({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();

  const handleSubmit = async (value: { email: string; password: string }) => {
    const response = await authClient.signIn.email({
      email: value.email,
      password: value.password,
    });

    if (response.error) {
      toast.error(response.error.message);
      return;
    }

    // 登录成功后重定向
    if (redirect) {
      navigate({ to: redirect });
    } else if (response.user?.role?.includes("admin")) {
      navigate({ to: "/admin/dashboard" });
    } else {
      navigate({ to: "/org/dashboard" });
    }
  };
}
```

---

## 组件共置规则

### 目录结构

```
routes/
├── admin/
│   └── -components/           # Admin 专用组件
│       ├── app-sidebar.tsx
│       └── nav-user.tsx
├── org/
│   └── -components/           # Org 专用组件
│       ├── app-sidebar.tsx
│       ├── nav-user.tsx
│       └── org-switcher.tsx
└── (public)/
    └── -components/           # 公共页面组件
        ├── header.tsx
        └── footer.tsx
```

### 规则说明

| 规则 | 说明 |
|------|------|
| **Dash 前缀** | `-components/` 文件夹不会自动注册为路由 |
| **就近原则** | 组件应该与使用它的路由放在同一目录下 |
| **避免重复** | 跨路由组共享的组件 → `src/components/` |
| **命名规范** | 路由文件使用 `kebab-case`，组件使用 `PascalCase` |

### 示例

**正确**: Admin 专用组件放在 `admin/-components/`

```typescript
// routes/admin/-components/app-sidebar.tsx
export function AppSidebar() {
  return <aside>Admin Navigation</aside>;
}

// routes/admin/dashboard/index.tsx
import { AppSidebar } from "../-components/app-sidebar";
```

**错误**: 在 `routes/` 根目录创建组件

```typescript
// ❌ 错误：在 routes/ 根目录创建组件
// routes/sidebar.tsx
export function Sidebar() { ... }
```

**正确**: 跨路由组共享组件放在 `src/components/`

```typescript
// src/components/user-menu.tsx
export function UserMenu() { ... }

// routes/admin/-components/nav-user.tsx
import { UserMenu } from "@/components/user-menu";
```

---

## 路由模式规范

### 动态路由

使用 `$paramName` 语法定义动态路由段：

```typescript
// routes/org/teams/$teamId.tsx
export const Route = createFileRoute("/org/teams/$teamId")({
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { teamId } = Route.useParams();
  return <div>Team ID: {teamId}</div>;
}
```

### 布局路由

创建 `_layout.tsx` 作为子路由的布局：

```typescript
// routes/admin/_layout.tsx
export const Route = createFileRoute("/admin/_layout")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="flex">
      <AppSidebar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

### 路由树生成

运行 `bun run dev` 时自动生成 `routeTree.gen.ts`：

```typescript
// ❌ 不要手动编辑此文件
// apps/web/src/routeTree.gen.ts
export const routeTree = rootRoute.addChildren([
  publicRoute.addChildren([...]),
  authRoute.addChildren([...]),
  adminRoute.addChildren([...]),
  orgRoute.addChildren([...]),
]);
```

---

## 类型安全导航

### 使用 `<Link>` 组件

```typescript
import { Link } from "@tanstack/react-router";

// 类型安全的路由跳转
<Link to="/org/teams/$teamId" params={{ teamId: "123" }}>
  View Team
</Link>

// 带查询参数
<Link
  to="/login"
  search={{ redirect: "/org/dashboard" }}
>
  Sign In
</Link>
```

### 使用 `useNavigate()`

```typescript
import { useNavigate } from "@tanstack/react-router";

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({
      to: "/org/teams/$teamId",
      params: { teamId: "123" },
      search: { tab: "members" },
    });
  };

  return <Button onClick={handleClick}>Go to Team</Button>;
}
```

---

## 相关文档

- **路由开发规范**: [apps/web/src/routes/CLAUDE.md](../apps/web/src/routes/CLAUDE.md)
- **认证流程详解**: [authentication.md](./authentication.md)
- **组织数据模型**: [organization-model.md](./organization-model.md)
- [TanStack Router 文档](https://tanstack.com/router/latest)
