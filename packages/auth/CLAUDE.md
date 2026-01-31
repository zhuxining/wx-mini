# Auth Package

## 概述

Better-Auth configuration with Organization plugin, providing authentication and multi-tenant management for the SaaS platform.

---

## 结构

```
src/
└── index.ts              # Main auth export with plugin configuration
docs/
└── permission-design.md  # Complete permission system documentation
```

---

## 快速查找

| Task | Location |
|------|----------|
| Auth config | index.ts |
| Plugin setup | index.ts |
| Session schema | Auto-generated |
| Permission system design | docs/permission-design.md |

---

## 规范

### Better-Auth 配置

核心配置位于 [index.ts](src/index.ts)，包含 Organization 插件。

**关键设置**:

- `allowUserToCreateOrganization: true` - 普通用户可以创建组织
- `teams.enabled: true` - 启用团队系统

### Auth 表

所有 auth 相关表由 Better-Auth **自动生成**，定义在 `packages/db/src/schema/auth.ts`。**不要手动修改**。

---

## 核心概念

### 多租户结构

- 一个用户可以属于多个组织
- 每个组织有独立的成员、团队、邀请
- 通过 `activeOrganizationId` 切换当前活动组织

### 角色层级

**组织角色** (member.role):

- `owner`: 组织所有者，完全控制权
- `admin`: 组织管理员
- `member`: 普通成员，只读访问

### 团队系统

- 团队是组织的子集
- 一个用户可以属于多个团队
- 团队用于更精细的权限管理

---

## 权限系统

详细权限设计请参考: [docs/permission-design.md](./docs/permission-design.md)

**默认角色**:

- **Owner**: 完全控制，包括删除组织和管理角色
- **Admin**: 管理成员和团队（除删除组织和管理角色外）
- **Member**: 只读访问

---

## 已知类型问题

### activeOrganizationId

运行时由 Better-Auth 动态添加，但 TypeScript 类型缺失。**始终使用可选链**: `session?.user?.activeOrganizationId`

### Better-Auth 类型不完整

部分 API 返回类型不完整，需要使用 `as any` 并添加 `// biome-ignore lint/suspicious/noExplicitAny: <better-auth>` 注释

---

## 反模式

- **不要修改自动生成的 auth 表** - Better-Auth 管理 schema/auth.ts
- **不要绕过插件权限** - 使用 Better-Auth API，不要手动修改表
- **不要忽略 activeOrganizationId 类型问题** - 始终使用可选链

---

## 独特风格

- **基于插件的架构**: Organization 插件提供多租户 auth 功能
- **自动生成的 schema**: Auth 表由 Better-Auth 创建和管理
- **TanStack Start 集成**: 使用 `tanstackStartCookies()` 进行 SSR 友好的 session 管理

---

## 注意事项

- Session 在 `packages/api/src/context.ts` 中提取用于 oRPC
- Organization plugin 启用多租户 SaaS 架构
- `allowUserToCreateOrganization: false` - 普通用户不能创建组织

---

## 相关文档

- **权限系统设计**: [docs/permission-design.md](./docs/permission-design.md)
- **Better-Auth 插件参考**: [docs/plugin-reference.md](./docs/plugin-reference.md)
- **认证流程详解**: [docs/authentication.md](../../docs/authentication.md)
- **组织数据模型**: [docs/organization-model.md](../../docs/organization-model.md)
- **API 权限工具**: [/packages/api/CLAUDE.md](/packages/api/CLAUDE.md)
- **前端路由守卫**: [/apps/web/src/CLAUDE.md](/apps/web/CLAUDE.md)
