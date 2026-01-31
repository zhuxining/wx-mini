# 组织数据模型详解

## 概述

本文档详细说明了多租户 SaaS 平台的组织数据模型、业务规则和邀请流程。

---

## 核心概念

### 多租户架构

平台采用 **组织隔离** 的多租户架构：

1. **一个用户可以属于多个组织**
2. **每个组织有独立的成员、团队、邀请**
3. **通过 `activeOrganizationId` 切换当前活动组织**

### 角色层级

**系统级别**:

- `admin` (系统管理员) - 全平台管理，可访问所有 Admin API

**组织级别**:

- `owner` (组织所有者) - 完全控制权，可删除组织
- `admin` (组织管理员) - 可管理成员、团队、邀请
- `member` (普通成员) - 只读访问

### 团队系统

- 团队是 **组织的子集**，不属于其他团队
- 一个用户可以属于 **多个团队**
- 团队用于 **更精细的权限管理**

---

## 数据表结构

### organizations 表

**文件**: `packages/db/src/schema/organizations.ts`

**Schema 定义**:

```typescript
{
  id: string (uuidv7, primary key)
  name: string (not null)
  slug: string (unique, not null)
  logo: string (nullable)
  metadata: json (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**业务规则**:

- `slug` 必须 **全局唯一**，用于 URL 友好标识
- 一个用户可以属于多个组织
- `activeOrganizationId` 存储在 **session 中**，不在此表
- 删除组织前需确保没有未处理的邀请或团队成员

**API 端点**:

- `createOrganization` - 创建组织
- `listOrganizations` - 列出用户所属组织
- `getFullOrganization` - 获取完整组织信息
- `updateOrganization` - 更新组织信息
- `deleteOrganization` - 删除组织（仅 owner）
- `setActiveOrganization` - 设置活动组织

---

### members 表 (组织成员)

**文件**: `packages/db/src/schema/members.ts`

**Schema 定义**:

```typescript
{
  id: string (uuidv7, primary key)
  organizationId: string (fk: organizations)
  userId: string (fk: users)
  role: enum ("member", "admin", "owner")
  createdAt: timestamp
  updatedAt: timestamp
}
```

**业务规则**:

- **唯一约束**: `(organizationId, userId)` - 一个用户在一个组织中只能有一个角色
- **角色权限**:
  - `owner`: 完全控制，可以删除组织
  - `admin`: 可以管理成员、团队、邀请
  - `member`: 只读访问
- 删除用户前需移除其所有成员关系

**API 端点**:

- `addMember` - 添加成员（组织管理员）
- `removeMember` - 移除成员（组织管理员）
- `listMembers` - 列出成员（组织成员）
- `updateMemberRole` - 更新成员角色（组织管理员）
- `getActiveMember` - 获取当前成员信息（认证用户）

---

### teams 表 (团队)

**文件**: `packages/db/src/schema/teams.ts`

**Schema 定义**:

```typescript
{
  id: string (uuidv7, primary key)
  name: string (not null)
  organizationId: string (fk: organizations)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**业务规则**:

- 团队属于组织，**不属于其他团队**
- 团队可以包含该组织的任意成员
- 删除组织时 **级联删除** 所有团队

**API 端点**:

- `createTeam` - 创建团队（组织成员）
- `updateTeam` - 更新团队（组织成员）
- `removeTeam` - 删除团队（组织成员）
- `listTeams` - 列出团队（组织成员）

---

### team_members 表 (团队成员)

**文件**: `packages/db/src/schema/team-members.ts`

**Schema 定义**:

```typescript
{
  teamId: string (fk: teams)
  userId: string (fk: users)
  createdAt: timestamp
}
```

**业务规则**:

- **复合主键**: `(teamId, userId)`
- 一个用户在同一团队中只能出现一次
- 删除团队时 **级联删除** 所有团队成员
- 成员可以属于多个团队

**API 端点**:

- `addTeamMember` - 添加团队成员（组织成员）
- `removeTeamMember` - 移除团队成员（组织成员）

---

### invitations 表 (邀请)

**文件**: `packages/db/src/schema/invitations.ts`

**Schema 定义**:

```typescript
{
  id: string (uuidv7, primary key)
  email: string (not null)
  organizationId: string (fk: organizations)
  inviterId: string (fk: users)
  role: enum ("member", "admin")
  status: enum ("pending", "accepted", "rejected")
  expiresAt: timestamp (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**业务规则**:

- **唯一约束**: 同一 email 在同一组织中只能有一个 `pending` 状态的邀请
- 邀请 **7 天后** 自动过期
- 状态转换: `pending` → `accepted` 或 `rejected`
- 接受邀请后自动创建 member 记录
- 过期或拒绝的邀请无法再接受

**API 端点**:

- `inviteMember` - 邀请成员（组织管理员）
- `acceptInvitation` - 接受邀请（认证用户）
- `rejectInvitation` - 拒绝邀请（认证用户）
- `cancelInvitation` - 取消邀请（组织管理员）
- `getInvitation` - 获取邀请详情（公开，需验证 token）
- `listInvitations` - 列出邀请（组织管理员）

---

## 邀请流程

### 1. 创建邀请

**调用方**: 组织管理员

```typescript
await auth.api.inviteMember({
	body: {
		email: "newuser@example.com",
		organizationId: "org-123",
		role: "admin", // 或 "member"
	},
	headers: request.headers,
});
```

**业务规则**:

- 邀请者必须具有组织管理员权限
- 邀请的 role 只能是 `admin` 或 `member`（不能是 owner）
- 同一 email 在同一组织中只能有一个 `pending` 邀请
- 邀请 7 天后自动过期

### 2. 接受邀请

**调用方**: 被邀请用户（需登录）

```typescript
await auth.api.acceptInvitation({
	body: {
		invitationId: "inv-123",
	},
	headers: request.headers,
});
```

**业务规则**:

- 用户必须登录
- 邀请状态必须为 `pending`
- 邀请未过期（`expiresAt > now`）
- **自动创建** member 记录
- 邀请状态更新为 `accepted`

### 3. 拒绝邀请

**调用方**: 被邀请用户（需登录）

```typescript
await auth.api.rejectInvitation({
	body: {
		invitationId: "inv-123",
	},
	headers: request.headers,
});
```

**业务规则**:

- 用户必须登录
- 邀请状态必须为 `pending`
- 邀请状态更新为 `rejected`
- 拒绝后无法再接受

### 4. 取消邀请

**调用方**: 组织管理员

```typescript
await auth.api.cancelInvitation({
	body: {
		invitationId: "inv-123",
	},
	headers: request.headers,
});
```

**业务规则**:

- 取消者必须具有组织管理员权限
- 邀请状态必须为 `pending`
- 邀请状态更新为 `rejected`
- 被邀请者无法接受已取消的邀请

---

## 关系定义

### Drizzle ORM Relations

```typescript
// organizations → members (一对多)
export const organizationsRelations = relations(organizations, ({ many }) => ({
	members: many(members),
	teams: many(teams),
	invitations: many(invitations),
}));

// users → members (一对多)
export const usersRelations = relations(users, ({ many }) => ({
	members: many(members),
	sessions: many(sessions),
}));

// members → organizations (多对一)
export const membersRelations = relations(members, ({ one }) => ({
	organization: one(organizations, {
		fields: [referenceFields({ organizationId })],
		references: [id],
	}),
	user: one(users, {
		fields: [referenceFields({ userId })],
		references: [id],
	}),
}));

// teams → team_members (一对多)
export const teamsRelations = relations(teams, ({ many }) => ({
	teamMembers: many(teamMembers),
}));
```

**使用示例**:

```typescript
// 查询组织及其成员
const org = await db.query.organizations.findFirst({
	where: eq(organizations.id, orgId),
	with: {
		members: {
			with: {
				user: true,
			},
		},
	},
});

// 查询用户所属组织
const userMemberships = await db.query.members.findMany({
	where: eq(members.userId, userId),
	with: {
		organization: true,
	},
});
```

---

## 数据约束

### 唯一性约束

| 约束             | 表              | 字段                              |
| ---------------- | --------------- | --------------------------------- |
| 组织 slug 唯一   | `organizations` | `slug`                            |
| 用户在组织中唯一 | `members`       | `(organizationId, userId)`        |
| 邀请唯一性       | `invitations`   | `(organizationId, email, status)` |

### 级联删除

| 删除操作 | 级联删除               |
| -------- | ---------------------- |
| 删除组织 | → 删除成员、团队、邀请 |
| 删除团队 | → 删除团队成员         |
| 删除用户 | → 删除会话、成员关系   |

### 非空约束

- 所有表的 `name` 字段非空
- `createdAt` 和 `updatedAt` 自动管理

---

## 组织上下文规则

### 获取活动组织 ID

```typescript
// 方法 1: 从 session 获取 (推荐)
const orgId = session?.user?.activeOrganizationId || "";

// 方法 2: 从请求参数获取 (某些操作需要)
const orgId = input.organizationId;

// 优先级: input.organizationId > session.activeOrganizationId
```

### API 调用模式

```typescript
// 列出团队成员
const { data } = await orpc.organization.listTeams({ organizationId: orgId });

// 创建团队
const mutation = useMutation({
	mutationFn: orpc.organization.createTeam.mutate,
	onSuccess: () => {
		toast.success("Team created");
		queryClient.invalidateQueries({
			queryKey: orpc.organization.listTeams.key(),
		});
	},
});

mutation.mutate({ organizationId: orgId, name: "Engineering" });
```

---

## 相关文档

- **数据库 Schema 参考**: [packages/db/docs/schema-reference.md](/packages/db/docs/schema-reference.md)
- **认证流程详解**: [authentication.md](./authentication.md)
- **Organization API 目录**: [packages/api/docs/org-api.md](../packages/api/docs/org-api.md)
