# Admin API 端点目录

**文件**: `packages/api/src/routers/admin.ts`

**总数**: 15 个端点

---

## 用户管理 (6 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `createUser` | 创建用户 | Admin |
| `listUsers` | 列出用户（搜索、分页、排序） | Admin |
| `updateUser` | 更新用户信息 | Admin |
| `removeUser` | 删除用户 | Admin |
| `setUserPassword` | 设置用户密码 | Admin |
| `setRole` | 设置用户角色 | Admin |

---

## 封禁管理 (2 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `banUser` | 封禁用户 | Admin |
| `unbanUser` | 解封用户 | Admin |

---

## 会话管理 (5 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `listUserSessions` | 列出用户会话 | Admin |
| `revokeUserSession` | 撤销单个会话 | Admin |
| `revokeUserSessions` | 撤销所有会话 | Admin |
| `impersonateUser` | 模拟用户 | Admin |
| `stopImpersonating` | 停止模拟 | Admin |

---

## 权限检查 (1 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `hasPermission` | 检查权限 | Admin |

---

## 调用示例

```typescript
import { orpc } from "@/utils/orpc";

// 列出用户
const { data } = await orpc.admin.listUsers({
  search: "john",
  limit: 20,
  offset: 0,
});

// 创建用户
await orpc.admin.createUser({
  email: "user@example.com",
  password: "securePassword",
  name: "John Doe",
});

// 封禁用户
await orpc.admin.banUser({
  userId: "user-123",
  reason: "Violation of terms",
});
```
