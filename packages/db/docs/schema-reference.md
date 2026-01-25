# Schema 参考文档

## 概述

本文档提供了 Drizzle ORM schema 定义的完整参考，包括所有表结构、关系定义和约束。

**重要**: 所有 auth 相关表由 Better-Auth 自动生成，**不要手动修改** `auth.ts` 文件。

---

## 认证表 (Better-Auth 自动生成)

### user 表

**文件**: `src/schema/auth.ts`

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),

  // Admin plugin 字段
  role: text("role").default("user"),      // Admin: ["admin"], User: "user"
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});
```

**字段说明**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | text | PRIMARY KEY | 用户 ID (Better-Auth 生成) |
| `email` | text | UNIQUE, NOT NULL | 邮箱地址 |
| `role` | text | DEFAULT "user" | 用户角色 |
| `banned` | boolean | DEFAULT false | 是否被封禁 |
| `banReason` | text | NULLABLE | 封禁原因 |
| `banExpires` | timestamp | NULLABLE | 封禁过期时间 |

**关系**:

- `sessions` → 一对多 → session
- `accounts` → 一对多 → account
- `memberships` → 一对多 → member
- `invitationsSent` → 一对多 → invitation
- `teamMemberships` → 一对多 → teamMember

---

### session 表

```typescript
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Admin plugin 字段
  impersonatedBy: text("impersonated_by"),  // Admin 模拟用户时记录

  // Organization plugin 字段
  activeOrganizationId: text("active_organization_id"),  // 当前活动组织
  activeTeamId: text("active_team_id"),                  // 当前活动团队
}, (table) => [
  index("session_userId_idx").on(table.userId),
]);
```

**字段说明**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `token` | text | UNIQUE, NOT NULL | Session token (HTTP-only cookie) |
| `expiresAt` | timestamp | NOT NULL | 过期时间 |
| `ipAddress` | text | NULLABLE | 客户端 IP |
| `userAgent` | text | NULLABLE | 客户端 User-Agent |
| `impersonatedBy` | text | NULLABLE | Admin 模拟用户时记录 Admin ID |
| `activeOrganizationId` | text | NULLABLE | 当前活动组织 ID |
| `activeTeamId` | text | NULLABLE | 当前活动团队 ID |

**索引**:

- `session_userId_idx` - 加速按用户查询 session

---

### account 表

```typescript
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("account_userId_idx").on(table.userId),
]);
```

**字段说明**: OAuth 账户关联表，用于第三方登录（如 Google、GitHub）。

---

### verification 表

```typescript
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("verification_identifier_idx").on(table.identifier),
]);
```

**字段说明**: 用于邮箱验证、密码重置等场景。

---

## 组织表 (Organization Plugin)

### organization 表

```typescript
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**字段说明**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `slug` | text | UNIQUE, NOT NULL | URL 友好标识符 |
| `logo` | text | NULLABLE | 组织 Logo URL |
| `metadata` | text | NULLABLE | JSON 元数据 |

**关系**:

- `members` → 一对多 → member
- `invitations` → 一对多 → invitation
- `roles` → 一对多 → organizationRole
- `teams` → 一对多 → team

---

### member 表 (组织成员)

```typescript
export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role").notNull(),  // "owner", "admin", "member"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("member_organization_id_user_id_idx").on(
      table.organizationId,
      table.userId
    ),
  ],
);
```

**字段说明**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `userId` | text | FK(user), NOT NULL | 用户 ID |
| `organizationId` | text | FK(organization), NOT NULL | 组织 ID |
| `role` | text | NOT NULL | 角色: "owner", "admin", "member" |

**索引**:

- `member_organization_id_user_id_idx` - 复合索引，加速查询用户在组织中的成员关系

**关系**:

- `user` → 多对一 → user
- `organization` → 多对一 → organization

---

### invitation 表 (邀请)

```typescript
export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),  // "admin", "member"
    status: text("status").notNull().default("pending"),  // "pending", "accepted", "rejected"
    expiresAt: timestamp("expires_at").notNull(),
    teamId: text("team_id"),  // 可选：直接加入团队
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("invitation_organization_id_email_idx").on(
      table.organizationId,
      table.email
    ),
  ],
);
```

**字段说明**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `email` | text | NOT NULL | 被邀请人邮箱 |
| `inviterId` | text | FK(user), NOT NULL | 邀请人 ID |
| `role` | text | NOT NULL | 邀请角色: "admin", "member" |
| `status` | text | DEFAULT "pending" | 状态: "pending", "accepted", "rejected" |
| `expiresAt` | timestamp | NOT NULL | 过期时间 (7 天后) |
| `teamId` | text | FK(team), NULLABLE | 可选：直接加入团队 |

**关系**:

- `organization` → 多对一 → organization
- `inviter` → 多对一 → user
- `team` → 多对一 → team (可选)

---

### organizationRole 表 (自定义角色)

```typescript
export const organizationRole = pgTable(
  "organization_role",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role").notNull(),           // 角色名称
    permission: text("permission").notNull(), // 权限字符串
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("organization_role_organization_id_idx").on(table.organizationId),
  ],
);
```

**字段说明**: 用于创建自定义角色和细粒度权限控制。

**关系**:

- `organization` → 多对一 → organization

---

### team 表 (团队)

```typescript
export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("team_organization_id_idx").on(table.organizationId),
  ],
);
```

**字段说明**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `name` | text | NOT NULL | 团队名称 |
| `organizationId` | text | FK(organization), NOT NULL | 所属组织 |

**索引**:

- `team_organization_id_idx` - 加速查询组织的团队列表

**关系**:

- `organization` → 多对一 → organization
- `members` → 一对多 → teamMember

---

### teamMember 表 (团队成员)

```typescript
export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("team_member_team_id_user_id_idx").on(table.teamId, table.userId),
  ],
);
```

**字段说明**:

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `teamId` | text | FK(team), NOT NULL | 团队 ID |
| `userId` | text | FK(user), NOT NULL | 用户 ID |

**索引**:

- `team_member_team_id_user_id_idx` - 复合索引，加速查询团队成员

**关系**:

- `team` → 多对一 → team
- `user` → 多对一 → user

---

## 关系定义

### Drizzle Relations

```typescript
// user 关系
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(member),
  invitationsSent: many(invitation),
  teamMemberships: many(teamMember),
}));

// organization 关系
export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  roles: many(organizationRole),
  teams: many(team),
}));

// member 关系
export const memberRelations = relations(member, ({ one }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
}));

// invitation 关系
export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [invitation.teamId],
    references: [team.id],
  }),
}));

// team 关系
export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  members: many(teamMember),
}));

// teamMember 关系
export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));
```

---

## 级联删除规则

| 操作 | 级联删除 |
|------|---------|
| 删除用户 | → 删除 session、account、member、teamMember |
| 删除组织 | → 删除 member、invitation、organizationRole、team |
| 删除团队 | → 删除 teamMember、invitation (teamId) |

---

## 索引汇总

| 索引名 | 表 | 字段 | 用途 |
|--------|---|------|------|
| `session_userId_idx` | session | userId | 按用户查询 session |
| `account_userId_idx` | account | userId | 按用户查询账户 |
| `verification_identifier_idx` | verification | identifier | 按标识符查询验证码 |
| `member_organization_id_user_id_idx` | member | organizationId, userId | 查询用户在组织中的成员关系 |
| `invitation_organization_id_email_idx` | invitation | organizationId, email | 查询组织的待处理邀请 |
| `organization_role_organization_id_idx` | organizationRole | organizationId | 查询组织的自定义角色 |
| `team_organization_id_idx` | team | organizationId | 查询组织的团队列表 |
| `team_member_team_id_user_id_idx` | teamMember | teamId, userId | 查询团队成员 |

---

## 查询示例

### 查询用户所属组织

```typescript
const userMemberships = await db.query.members.findMany({
  where: eq(members.userId, userId),
  with: {
    organization: true,
  },
});
```

### 查询组织成员

```typescript
const orgMembers = await db.query.members.findMany({
  where: eq(members.organizationId, orgId),
  with: {
    user: {
      columns: {
        password: false,  // 排除敏感字段
      },
    },
  },
});
```

### 查询团队成员

```typescript
const teamMembers = await db.query.teamMembers.findMany({
  where: eq(teamMembers.teamId, teamId),
  with: {
    user: true,
    team: true,
  },
});
```

### 查询待处理邀请

```typescript
const pendingInvitations = await db.query.invitations.findMany({
  where: and(
    eq(invitations.organizationId, orgId),
    eq(invitations.status, "pending"),
    gt(invitations.expiresAt, new Date())  // 未过期
  ),
  with: {
    inviter: true,
  },
});
```

---

## 相关文档

- **数据模型业务规则**: [docs/organization-model.md](../../../docs/organization-model.md)
- **数据库包规范**: [packages/db/src/CLAUDE.md](../CLAUDE.md)
- **Better-Auth 配置**: [packages/auth/CLAUDE.md](../../auth/CLAUDE.md)
