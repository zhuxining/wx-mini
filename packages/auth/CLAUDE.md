# Auth Package

## 概述

Better-Auth configuration with Admin and Organization plugins, providing authentication and multi-tenant management for the SaaS platform.

---

## 结构

```
src/
└── index.ts              # Main auth export with plugin configuration
```

---

## 快速查找

| Task | Location |
|------|----------|
| Auth config | index.ts |
| Plugin setup | index.ts |
| Session schema | Auto-generated |

---

## 规范

### Better-Auth Setup

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
    admin(),
    organization({
      allowUserToCreateOrganization: true,
      teams: {
        enabled: true,
      },
      customRoles: {
        enabled: true,
      },
    }),
  ],
});
```

### Auth Tables

所有 auth 相关表由 Better-Auth **自动生成**：

- 表定义在 `packages/db/src/schema/auth.ts`
- **不要手动修改这些文件**
- Schema 更改由 Better-Auth migrations 处理

---

## 核心概念

### 多租户结构

- 一个用户可以属于多个组织
- 每个组织有独立的成员、团队、邀请
- 通过 `activeOrganizationId` 切换当前活动组织

### 角色层级

- `owner`: 组织所有者，完全控制权
- `admin`: 组织管理员，可以管理成员、团队、邀请
- `member`: 普通成员，只读访问

### 团队系统

- 团队是组织的子集
- 一个用户可以属于多个团队
- 团队用于更精细的权限管理

### 自定义角色

- 组织可以创建自定义角色
- 每个角色可以配置细粒度权限
- 支持角色继承和权限组合

---

## 已知类型问题

`activeOrganizationId` 属性在运行时由 Better-Auth Organization 插件动态添加，但 TypeScript 类型定义中缺失。

**解决方案**: 始终使用可选链

```typescript
// ❌ TypeScript 报错
const orgId = session.user.activeOrganizationId;

// ✅ 正确方式
const orgId = session?.user?.activeOrganizationId || "";
```

---

## 反模式

- **不要修改自动生成的 auth 表** - Better-Auth 管理 schema/auth.ts
- **不要绕过插件权限** - 使用 Better-Auth API，不要手动修改表
- **不要硬编码角色检查** - 使用 `context.session?.user?.role?.includes("admin")`
- **不要忽略 activeOrganizationId 类型问题** - 始终使用可选链

---

## 独特风格

- **基于插件的架构**: Admin 和 Organization 插件提供完整的 auth 功能
- **自动生成的 schema**: Auth 表由 Better-Auth 创建和管理
- **TanStack Start 集成**: 使用 `tanstackStartCookies()` 进行 SSR 友好的 session 管理

---

## 注意事项

- Session 在 `packages/api/src/context.ts` 中提取用于 oRPC
- Admin plugin 启用跨组织用户管理
- Organization plugin 启用多租户 SaaS 架构
- activeOrganizationId 类型问题已跟踪但不影响运行时

---

## 相关文档

- **Better-Auth 插件参考**: [docs/plugin-reference.md](./docs/plugin-reference.md)
- **认证流程详解**: [docs/authentication.md](../../docs/authentication.md)
- **组织数据模型**: [docs/organization-model.md](../../docs/organization-model.md)
