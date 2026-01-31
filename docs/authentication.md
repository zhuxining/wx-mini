# 认证流程详解

## 概述

本文档详细说明了 Better-Auth 认证系统的核心概念、权限检查模式和 Session 管理。

---

## Session 结构

### Session 对象

**获取方式**:

- 服务端: `context.session` (在 oRPC handlers 中)
- 客户端: `await orpc.privateData.query()`
- Better-Auth API: `await auth.api.getSession({ headers })`

**完整结构**:

```typescript
{
  user: {
    id: string;                      // UUID v7
    email: string;
    name: string;
    image: string | null;
    activeOrganizationId: string;    // ⚠️ 运行时存在，类型定义缺失
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

### 类型问题处理

**已知问题**: `activeOrganizationId` 属性在运行时由 Better-Auth Organization 插件动态添加，但 TypeScript 类型定义中缺失。

**解决方案**: 始终使用可选链访问

```typescript
// ❌ TypeScript 报错
const orgId = session.user.activeOrganizationId;

// ✅ 正确方式
const orgId = session?.user?.activeOrganizationId || "";

// ✅ 在 oRPC handler 中
const orgId = context.session?.user?.activeOrganizationId || "";
```

---

## 权限检查模式

### Organization API 权限检查

**适用端点**: `packages/api/src/routers/organization.ts` 中所有 28 个端点

**权限机制**: Better-Auth Organization 插件自动验证

```typescript
// 文件: packages/api/src/routers/organization.ts
orgEndpoint: protectedProcedure
  .handler(async ({ input, context }) => {
    // Better-Auth Organization 插件自动验证:
    // 1. 用户是否登录 (由 protectedProcedure 中间件处理)
    // 2. 用户是否属于该组织
    // 3. 用户是否有足够权限执行操作

    // 无需手动检查权限，直接调用 Better-Auth API
    return await auth.api.someMethod({
      body: input,
      headers: context.req.headers
    });
  })
```

**组织角色层级**:

| 角色 | 权限 |
|------|------|
| `owner` | 组织所有者，完全控制权，可删除组织 |
| `admin` | 组织管理员，可管理成员、团队、邀请 |
| `member` | 普通成员，只读访问 |

### 路由级别权限检查

**文件**: `apps/web/src/routes/CLAUDE.md`

**Organization 路由守卫**:

```typescript
// 在 org/ 路由中
export const loader = async () => {
  const session = await requireAuth();

  // 检查是否选择了组织
  const orgId = session?.user?.activeOrganizationId;
  if (!orgId) {
    throw redirect({ to: "/org/select" });
  }

  return defer({ session, orgId });
};
```

---

## 认证流程

### 1. 用户登录

**Better-Auth API**:

```typescript
await auth.api.signIn.email({
  body: {
    email: "user@example.com",
    password: "password",
  },
});
```

**流程说明**:

1. Better-Auth 验证邮箱和密码
2. 创建 session 记录
3. 设置 HTTP-only cookie
4. 返回用户信息

### 2. Session 管理

**服务端获取 Session**:

```typescript
const session = await auth.api.getSession({
  headers: request.headers,
});
```

**客户端获取 Session**:

```typescript
import { orpc } from "@/utils/orpc";

const { data } = await orpc.privateData.query();
// data.session?.user
```

**在 oRPC handler 中获取 Session**:

```typescript
protectedProcedure.handler(({ context }) => {
  // context.session 始终可用
  return { user: context.session?.user };
});
```

### 3. 组织切换

**设置活动组织**:

```typescript
await auth.api.setActiveOrganization({
  body: {
    organizationId: "org-123",
  },
  headers: request.headers,
});
```

**流程说明**:

1. 验证用户是否属于该组织
2. 更新 session.user.activeOrganizationId
3. 后续请求使用新组织上下文

**获取活动组织 ID**:

```typescript
// 方法 1: 从 session 获取 (推荐)
const orgId = session?.user?.activeOrganizationId || "";

// 方法 2: 从请求参数获取 (某些操作需要)
const orgId = input.organizationId;

// 优先级: input.organizationId > session.activeOrganizationId
```

---

## 错误处理模式

### 统一错误处理

```typescript
try {
  const result = await auth.api.someMethod({
    body: input,
    headers: context.req.headers
  });
  return result;
} catch (error) {
  // 统一错误处理
  if (error.message?.includes("not found")) {
    throw new ORPCError("NOT_FOUND", "Resource not found");
  }
  if (error.message?.includes("unauthorized")) {
    throw new ORPCError("UNAUTHORIZED", "Access denied");
  }
  if (error.message?.includes("forbidden")) {
    throw new ORPCError("FORBIDDEN", "Permission denied");
  }
  throw new ORPCError("INTERNAL_SERVER_ERROR", "An error occurred");
}
```

### 常见错误映射

| 错误类型 | ORPC Error Code | 说明 |
|---------|-----------------|------|
| 用户不存在 | `NOT_FOUND` | 资源未找到 |
| 无权限操作 | `FORBIDDEN` | 权限不足 |
| 未登录 | `UNAUTHORIZED` | 缺少有效 session |
| 数据库错误 | `INTERNAL_SERVER_ERROR` | 服务器内部错误 |

---

## 相关文档

- **Better-Auth 配置**: [packages/auth/CLAUDE.md](../packages/auth/CLAUDE.md)
- **API 权限模式**: [packages/api/CLAUDE.md](../packages/api/CLAUDE.md)
- **组织数据模型**: [organization-model.md](./organization-model.md)
- **路由权限**: [route-permissions.md](./route-permissions.md)
