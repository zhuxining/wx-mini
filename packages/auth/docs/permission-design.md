# 组织角色权限体系设计文档

本文档详细说明了基于 Better-Auth 的多租户 SaaS 平台的权限体系设计。

---

## 1. 权限架构概述

### 1.1 组织权限模型

```
┌─────────────────────────────────────────────────────────────┐
│                  ORGANIZATION LAYER (组织级)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Owner     │  │  Admin       │  │   Member     │       │
│  │              │  │              │  │              │       │
│  │ 完全控制     │  │  部分管理    │  │  只读访问    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 角色定义

| 角色 | 标识 | 权限范围 |
|------|------|----------|
| **Owner** | `member.role = "owner"` | 完全控制组织 |
| **Admin** | `member.role = "admin"` | 管理成员和团队 |
| **Member** | `member.role = "member"` | 只读访问 |

---

## 2. Better-Auth 配置

### 2.1 核心配置

文件位置: [packages/auth/src/index.ts](../src/index.ts)

```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    tanstackStartCookies(),
    organization({
      // ❌ 普通用户不能创建组织
      allowUserToCreateOrganization: false,

      teams: {
        enabled: true,            // 启用团队系统
      },
    }),
  ],
});
```

### 2.2 关键配置说明

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `allowUserToCreateOrganization` | `false` | 普通用户不能创建组织 |
| `teams.enabled` | `true` | 启用团队系统 |

---

## 3. API 权限检查

### 3.1 权限工具函数

文件位置: [packages/api/src/lib/permissions.ts](../../api/src/lib/permissions.ts)

#### 核心函数

```typescript
// 检查组织权限
export async function checkPermission(
  context: Context,
  resource: string,
  actions: string[],
  organizationId?: string,
): Promise<PermissionCheckResult>

// 要求组织权限
export async function requirePermission(
  context: Context,
  resource: string,
  actions: string[],
  organizationId?: string,
): Promise<void>

// 检查是否为组织所有者
export async function isOrganizationOwner(
  context: Context,
  organizationId: string,
): Promise<boolean>

// 要求组织所有者权限
export async function requireOrganizationOwner(
  context: Context,
  organizationId: string,
): Promise<void>
```

### 3.2 使用示例

```typescript
// 在 API 端点中使用
deleteOrganization: protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    // 要求组织所有者权限
    await requireOrganizationOwner(context, input.organizationId);

    // 业务逻辑...
  })
```

---

## 4. 前端权限守卫

### 4.1 路由守卫

文件位置: [apps/web/src/utils/permission-guards.ts](/apps/web/src/utils/permission-guards.ts)

```typescript
// 要求 owner 角色
export async function requireOwner(
  ctx: BeforeLoadContext,
  redirectTo = "/org/dashboard",
): Promise<void>

// 要求 admin 或更高角色（包含 owner）
export async function requireAdmin(
  ctx: BeforeLoadContext,
  redirectTo = "/org/dashboard",
): Promise<void>

// 要求任一角色
export async function requireAnyRole(
  ctx: BeforeLoadContext,
  roles: Array<"owner" | "admin" | "member">,
  redirectTo = "/org/dashboard",
): Promise<void>
```

### 4.2 使用示例

```typescript
// 在路由中使用
export const Route = createFileRoute("/org/settings")({
  beforeLoad: async (ctx) => {
    const session = await requireActiveOrg(ctx);

    // 要求 admin 或更高权限
    await requireAdmin({ context: ctx });
  },
  component: OrgSettings,
});
```

---

## 5. 权限矩阵

### 5.1 组织权限矩阵

| 操作 | Owner | Admin | Member |
|------|-------|-------|--------|
| 删除组织 | ✅ | ❌ | ❌ |
| 更新组织设置 | ✅ | ✅ | ❌ |
| 查看分析数据 | ✅ | ✅ | ✅ |
| 添加成员 | ✅ | ✅ | ❌ |
| 移除成员 | ✅ | ✅ | ❌ |
| 更新成员角色 | ✅ | ❌ | ❌ |
| 创建邀请 | ✅ | ✅ | ❌ |
| 取消邀请 | ✅ | ✅ | ❌ |
| 创建团队 | ✅ | ✅ | ❌ |
| 删除团队 | ✅ | ✅ | ❌ |
| 管理团队成员 | ✅ | ✅ | ❌ |
| 查看数据 | ✅ | ✅ | ✅ |

---

## 6. 安全考虑

### 6.1 关键安全规则

1. **权限检查顺序**: 权限检查必须在数据库查询之前进行
2. **自我修改保护**: 用户不能修改自己的角色
3. **最后所有者保护**: 不能移除或降级组织的最后一个 Owner
4. **系统角色保护**: 默认角色（owner/admin/member）不能被修改或删除

### 6.2 权限检查流程

```
请求 → API 路由
        ↓
   protectedProcedure (认证检查)
        ↓
   requirePermission (权限检查)
        ↓
   Better-Auth hasPermission
        ↓
   业务逻辑
```

---

## 7. 类型定义

### 7.1 核心类型

```typescript
// 组织角色类型（API 层）
type OrgRole = "member" | "admin" | "owner";

// 组织内置角色
type OrgBuiltInRole = "owner" | "admin" | "member";

// 角色层级
const ROLE_HIERARCHY: Record<OrgBuiltInRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
} as const;
```

---

## 8. 故障排查

### 8.1 常见问题

**Q: 如何检查用户权限？**

A: 使用 `checkPermission` 或 `requirePermission` 函数，前端可使用 `requireAdmin`、`requireOwner` 等路由守卫。

**Q: 如何添加新的权限检查？**

A: 在 API 端点中使用 `requirePermission` 函数，在前端路由中使用 `requireAdmin` 或 `requireOwner` 守卫。

---

## 9. 相关文档

- **Better-Auth 文档**: [packages/auth/docs/plugin-reference.md](./plugin-reference.md)
- **认证配置**: [packages/auth/CLAUDE.md](../CLAUDE.md)
- **API 权限工具**: [packages/api/CLAUDE.md](../../api/CLAUDE.md)
- **前端路由守卫**: [apps/web/CLAUDE.md](/apps/web/CLAUDE.md)
