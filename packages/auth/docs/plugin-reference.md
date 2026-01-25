# Better-Auth 插件配置参考

## 概述

本文档详细说明了 Better-Auth 的插件配置、核心功能和 API 使用方法。

**文件**: `packages/auth/src/index.ts`

---

## 核心配置

### 完整配置

```typescript
import { db } from "@org-sass/db";
import * as schema from "@org-sass/db/schema/auth";
import { env } from "@org-sass/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { organization } from "better-auth/plugins/organization";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
  // 1. 数据库适配器
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  // 2. CORS 配置
  trustedOrigins: [env.CORS_ORIGIN],

  // 3. 邮箱密码认证
  emailAndPassword: {
    enabled: true,
  },

  // 4. 插件
  plugins: [
    tanstackStartCookies(),
    admin(),
    organization({
      allowUserToCreateOrganization: true,
      teams: { enabled: true },
      customRoles: { enabled: true },
    }),
  ],
});
```

---

## 数据库适配器

### Drizzle Adapter

```typescript
database: drizzleAdapter(db, {
  provider: "pg",              // PostgreSQL
  schema: schema,              // Drizzle schema
}),
```

**支持的提供者**:

- `pg` - PostgreSQL
- `mysql` - MySQL
- `sqlite` - SQLite

**Schema 要求**:

- 必须包含 Better-Auth 自动生成的表 (user, session, account, verification)
- Organization 插件会自动添加组织相关表

---

## 认证方法

### 邮箱密码认证

```typescript
emailAndPassword: {
  enabled: true,
  // 可选配置
  requireEmailVerification: false,  // 是否需要邮箱验证
  sendResetPassword: async (url) => {
    // 自定义密码重置邮件发送逻辑
    await sendEmail(url);
  },
  sendVerificationEmail: async (url) => {
    // 自定义验证邮件发送逻辑
    await sendEmail(url);
  },
},
```

**默认启用**: 邮箱密码登录

**API 端点**:

- `signIn.email` - 邮箱密码登录
- `signUp.email` - 邮箱密码注册
- `resetPassword` - 重置密码
- `verifyEmail` - 验证邮箱

---

## 插件系统

### 1. TanStack Start Cookies 插件

**导入**: `import { tanstackStartCookies } from "better-auth/tanstack-start"`

**作用**: 为 TanStack Start SSR 提供优化的 cookie 管理

**功能**:

- 自动处理 SSR 环境下的 cookie 读写
- 支持 HTTP-only session cookie
- 与 TanStack Start 的请求上下文集成

**无需配置**，直接添加到 plugins 数组即可。

---

### 2. Admin 插件

**导入**: `import { admin } from "better-auth/plugins/admin"`

**配置**:

```typescript
admin({
  // 默认配置，无需额外参数
  adminRole: "admin",  // 可选：自定义 admin 角色名称
})
```

**功能**:

| 功能 | 说明 |
|------|------|
| **角色管理** | `user.role` 字段存储系统管理员角色 |
| **用户模拟** | Admin 可以模拟其他用户身份 |
| **会话管理** | Admin 可以查看和撤销用户会话 |
| **封禁管理** | Admin 可以封禁/解封用户 |

**添加的 Schema 字段** (`user` 表):

```typescript
{
  role: text("role").default("user"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
}
```

**添加的 Schema 字段** (`session` 表):

```typescript
{
  impersonatedBy: text("impersonated_by"),  // Admin 模拟用户时记录
}
```

**API 端点** (15 个):

| 分类 | 端点 |
|------|------|
| 用户管理 | `createUser`, `listUsers`, `updateUser`, `removeUser`, `setUserPassword`, `setRole` |
| 封禁管理 | `banUser`, `unbanUser` |
| 会话管理 | `listUserSessions`, `revokeUserSession`, `revokeUserSessions`, `impersonateUser`, `stopImpersonating` |
| 权限检查 | `hasPermission` |

**详细文档**: [packages/api/docs/admin-api.md](../../api/docs/admin-api.md)

---

### 3. Organization 插件

**导入**: `import { organization } from "better-auth/plugins/organization"`

**配置**:

```typescript
organization({
  // 允许用户创建组织
  allowUserToCreateOrganization: true,

  // 启用团队功能
  teams: {
    enabled: true,
  },

  // 启用自定义角色
  customRoles: {
    enabled: true,
  },

  // 可选：角色配置
  roles: {
    admin: ["member", "admin", "owner"],
    member: ["member"],
  },
})
```

**功能**:

| 功能 | 说明 |
|------|------|
| **多租户架构** | 用户可以属于多个组织，通过 `activeOrganizationId` 切换 |
| **角色层级** | owner > admin > member |
| **团队系统** | 组织可以创建团队，成员可以属于多个团队 |
| **邀请系统** | 通过邮箱邀请用户加入组织 |
| **自定义角色** | 组织可以创建自定义角色和权限 |

**添加的 Schema 字段** (`session` 表):

```typescript
{
  activeOrganizationId: text("active_organization_id"),
  activeTeamId: text("active_team_id"),
}
```

**添加的表**:

| 表名 | 说明 |
|------|------|
| `organization` | 组织表 |
| `member` | 组织成员关系表 |
| `invitation` | 邀请表 |
| `team` | 团队表 |
| `teamMember` | 团队成员关系表 |
| `organizationRole` | 自定义角色表 |

**API 端点** (28 个):

| 分类 | 端点 |
|------|------|
| 组织管理 | `createOrganization`, `listOrganizations`, `getFullOrganization`, `updateOrganization`, `deleteOrganization`, `setActiveOrganization` |
| 成员管理 | `addMember`, `removeMember`, `listMembers`, `updateMemberRole`, `getActiveMember` |
| 邀请管理 | `inviteMember`, `acceptInvitation`, `rejectInvitation`, `cancelInvitation`, `getInvitation`, `listInvitations` |
| 团队管理 | `createTeam`, `updateTeam`, `removeTeam`, `listTeams`, `addTeamMember`, `removeTeamMember` |
| 角色权限 | `createRole`, `updateRole`, `deleteRole`, `listRoles`, `hasPermission` |

**详细文档**: [packages/api/docs/org-api.md](../../api/docs/org-api.md)

---

## 核心 API

### Session 管理

**获取 Session**:

```typescript
// 服务端
const session = await auth.api.getSession({
  headers: request.headers,
});

// 检查是否登录
if (!session) {
  throw redirect({ to: "/login" });
}
```

**Session 结构**:

```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: string[];              // ["admin"] 或 []
    image: string | null;
    activeOrganizationId: string; // ⚠️ 运行时存在，类型定义缺失
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress: string | null;
    userAgent: string | null;
  };
}
```

---

### 认证 API

**登录**:

```typescript
await auth.api.signIn.email({
  body: {
    email: "user@example.com",
    password: "password",
  },
});
```

**注册**:

```typescript
await auth.api.signUp.email({
  body: {
    email: "user@example.com",
    password: "password",
    name: "John Doe",
  },
});
```

**登出**:

```typescript
await auth.api.signOut({
  headers: request.headers,
});
```

---

### 组织 API

**创建组织**:

```typescript
await auth.api.createOrganization({
  body: {
    name: "Acme Corp",
    slug: "acme-corp",
    logo: "https://example.com/logo.png",
  },
  headers: request.headers,
});
```

**切换活动组织**:

```typescript
await auth.api.setActiveOrganization({
  body: {
    organizationId: "org-123",
  },
  headers: request.headers,
});
```

**列出成员**:

```typescript
const members = await auth.api.listMembers({
  query: {
    organizationId: "org-123",
  },
  headers: request.headers,
});
```

---

### Admin API

**创建用户**:

```typescript
await auth.api.createUser({
  body: {
    email: "admin@example.com",
    password: "securePassword",
    name: "Admin User",
    role: ["admin"],
  },
  headers: request.headers,
});
```

**封禁用户**:

```typescript
await auth.api.banUser({
  body: {
    userId: "user-123",
    reason: "Violation of terms",
  },
  headers: request.headers,
});
```

**模拟用户**:

```typescript
// 开始模拟
await auth.api.impersonateUser({
  body: { userId: "user-123" },
  headers: request.headers,
});

// 停止模拟
await auth.api.stopImpersonating({
  headers: request.headers,
});
```

---

## 环境变量

**文件**: `.env` 或 `packages/env/src/env.ts`

```typescript
CORS_ORIGIN: string;  // CORS 允许的源
DATABASE_URL: string; // PostgreSQL 连接字符串
```

**示例**:

```env
CORS_ORIGIN=http://localhost:3001
DATABASE_URL=postgresql://localhost:5432/org_saas
```

---

## 类型问题处理

### activeOrganizationId 类型缺失

**问题**: `session.user.activeOrganizationId` 在运行时存在，但 TypeScript 类型定义中缺失。

**解决方案**: 始终使用可选链

```typescript
// ❌ TypeScript 报错
const orgId = session.user.activeOrganizationId;

// ✅ 正确方式
const orgId = session?.user?.activeOrganizationId || "";

// ✅ 类型断言 (不推荐，但在某些场景有用)
const orgId = (session.user as any).activeOrganizationId || "";
```

---

## 中间件集成

### TanStack Start 集成

**文件**: `apps/web/src/server/auth.ts`

```typescript
import { auth } from "@org-sass/auth";
import { redirect } from "@tanstack/react-router";

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

## 相关文档

- **认证流程详解**: [docs/authentication.md](../../../docs/authentication.md)
- **组织数据模型**: [docs/organization-model.md](../../../docs/organization-model.md)
- **Better-Auth 官方文档**: [https://www.better-auth.com/docs](https://www.better-auth.com/docs)
