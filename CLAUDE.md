# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Better-T-Stack 技术栈构建的多组织 SaaS 平台，采用 **Turborepo** 管理的 Monorepo 架构。

**核心技术栈：**
- **前端框架**: TanStack Start (SSR) + TanStack Router + React 19
- **样式**: TailwindCSS 4 + shadcn/ui 组件库
- **后端**: oRPC (端到端类型安全 API) + Better-Auth (认证)
- **数据库**: PostgreSQL + Drizzle ORM
- **构建工具**: Turborepo + Vite + Biome
- **包管理器**: Bun

## 项目结构

```
org-saas/
├── apps/
│   ├── web/              # 主站应用 (TanStack Start SSR)
│   ├── mini/             # 微信小程序
│   └── fumadocs/         # 文档站点
└── packages/
    ├── api/              # oRPC API 层和业务逻辑
    ├── auth/             # Better-Auth 配置
    ├── db/               # 数据库模型和 Drizzle ORM
    ├── config/           # 共享配置
    └── env/              # 环境变量类型定义
```

### 关键目录说明

- **`apps/web/src/routes/`**: 基于文件系统的路由
  - `(public)/`: 公共页面（登录、落地页、定价、关于）
  - `org/`: 组织管理页面（仪表板、团队、成员）
  - `admin/`: 管理员页面（用户管理、组织管理）
  - 路由组使用括号语法 `(public)`, `(auth)` 创建，不会出现在 URL 中

- **`packages/api/src/routers/`**: oRPC 路由定义
  - `index.ts`: 导出 `publicProcedure` 和 `protectedProcedure`
  - `organization.ts`: 组织相关 API
  - `admin.ts`: 管理员相关 API

## 常用开发命令

### 开发和构建
```bash
# 启动所有应用 (推荐)
bun run dev

# 仅启动 Web 应用 (端口 3001)
bun run dev:web

# 构建所有应用
bun run build

# TypeScript 类型检查
bun run check-types
```

### 数据库操作
```bash
# 推送 schema 更改到数据库 (开发环境推荐，无需迁移文件)
bun run db:push

# 打开 Drizzle Studio 数据库管理界面
bun run db:studio

# 生成数据库 schema 类型
bun run db:generate

# 创建迁移文件 (生产环境使用)
bun run db:migrate
```

### 代码质量
```bash
# 格式化和 lint 修复 (使用 Biome)
bun run check
```

**注意**: Lefthook 会在 pre-commit 时自动运行 `bun run check`，确保提交前代码已格式化。

## 架构模式

### 1. 路由架构 (TanStack Router)

- **文件系统路由**: 在 `apps/web/src/routes/` 目录下创建文件自动生成路由
- **动态路由**: 使用 `$paramName` 语法，如 `$teamId.tsx`
- **布局路由**: 创建 `_layout.tsx` 作为子路由的布局
- **路由树生成**: 运行 `bun run dev` 时自动生成 `routeTree.gen.ts`，**不要手动编辑**

路由示例：
```
routes/
├── (public)/           # /pricing, /about
│   ├── pricing.tsx
│   └── about.tsx
├── org/                # /org/*
│   ├── _layout.tsx     # 组织区域布局
│   ├── dashboard.tsx   # /org/dashboard
│   └── teams/
│       └── $teamId.tsx # /org/teams/:teamId
```

### 2. API 架构 (oRPC)

**基础结构** (`packages/api/src/index.ts`):
- `publicProcedure`: 无需认证的公开 API
- `protectedProcedure`: 需要用户登录的 API（自动检查 session）
- `requireAdmin()`: 在需要管理员权限时手动调用

**使用示例**:
```typescript
// 定义 API
import { o } from "@/api";
export const organizationRouter = o.router({
  listMembers: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input, context }) => {
      // context.session.user 可用
      return await db.query.members.findMany(...);
    }),
});

// 在组件中调用
import { orpc } from "@/utils/orpc";
const { data } = await orpc.organization.listMembers({ organizationId: "..." });
```

**重要**:
- oRPC 提供端到端类型安全，无需手动定义 API 类型
- 在 SSR 中，oRPC handlers 可以在服务端直接运行（isomorphic）

### 3. 认证流程 (Better-Auth)

- **Session 管理**: 通过 Better-Auth 中间件自动注入到 context
- **用户信息**: `context.session?.user` 包含用户数据
- **组织切换**: `session.user.activeOrganizationId` 存储当前选中的组织
- **管理员检查**: `context.session?.user?.role` 包含用户角色

**已知类型问题**: `activeOrganizationId` 属性在运行时存在，但 TypeScript 类型中缺失。使用可选链：
```typescript
const orgId = session?.user?.activeOrganizationId || "";
```

### 4. 数据库 (Drizzle ORM)

- **Schema 定义**: `packages/db/src/schema/` 目录
- **查询构建**: 使用 Drizzle ORM 的查询构建器
- **类型安全**: 所有查询自动获得 TypeScript 类型

**迁移策略**:
- 开发环境：使用 `bun run db:push` 直接推送 schema，无需迁移文件
- 生产环境：使用 `bun run db:migrate` 创建和应用迁移文件

### 5. 状态管理 (TanStack Query)

- **SSR 友好**: TanStack Query 与 TanStack Start 深度集成
- **预加载**: 在路由 loader 中预取数据
- **缓存策略**: 使用 `queryOptions` 定义查询配置

```typescript
// 定义查询选项
const getMembersOptions = (organizationId: string) =>
  orpc.organization.listMembers.queryOptions({ organizationId });

// 在 loader 中预取
const loader = async () => {
  return defer({
    members: queryClient.ensureQueryData(getMembersOptions(orgId)),
  });
};

// 在组件中使用
const { data } = await loaderData.members;
```

## 代码规范

### 格式化 (Biome)
- **缩进**: 使用 Tab (`indentStyle: "tab"`)
- **引号**: 使用双引号 (`quoteStyle: "double"`)
- **自动导入排序**: 保存时自动执行
- **Tailwind 类名排序**: 启用 `useSortedClasses` 规则

### 导入规范
使用工作区路径引用共享包：
```typescript
import { orpc } from "@/utils/orpc";  // apps/web 内部导入
import { db } from "@org-sass/db";     // 跨包导入
```

### shadcn/ui 组件
- 组件位于 `apps/web/src/components/ui/`
- **不要手动编辑这些文件**（通过 shadcn CLI 生成）
- Biome 配置已忽略此目录

## 反模式和注意事项

### ❌ 不要做
1. **不要编辑 `routeTree.gen.ts`** - 自动生成，会被覆盖
2. **不要编辑 `apps/web/src/components/ui/*`** - 通过 shadcn CLI 管理
3. **不要在 protectedProcedure 中跳过 session 检查** - 中间件已自动处理
4. **不要在开发环境手动创建迁移文件** - 使用 `db:push` 代替
5. **不要修改 Better-Auth 生成的表结构** - 认证表自动管理

### ⚠️ 常见陷阱

1. **oRPC 查询选项类型**:
   - 问题：生成的类型期望 `{ input: {...} }` 结构
   - 解决：运行时直接传递对象 `{ organizationId: "..." }` 即可，类型警告不影响功能

2. **路由未识别**:
   - 问题：新建路由后 TypeScript 报错
   - 解决：运行 `bun run dev` 触发路由树生成

3. **Session 类型**:
   - 问题：`session.user.activeOrganizationId` 类型错误
   - 解决：使用可选链 `session?.user?.activeOrganizationId || ""`

4. **数据库连接**:
   - 确保 `apps/web/.env` 中配置了正确的 PostgreSQL 连接字符串
   - 默认：`postgresql://localhost:5432/org_saas`

## Git 工作流

- **Pre-commit hook**: 自动运行 Biome 格式化和 lint
- **分支策略**: `main` 为生产分支，`dev` 为开发分支
- **提交规范**: 建议使用 conventional commits（`feat:`, `fix:`, `refactor:` 等）

## 已知类型问题

项目存在一些不影响功能的 TypeScript 警告：

1. **activeOrganizationId 属性**: Better-Auth 在运行时添加此属性，但未在类型定义中包含
2. **queryOptions 类型不匹配**: oRPC 生成类型与使用模式存在差异

这些警告不影响代码运行，可以在开发时忽略。

## 开发提示

- **端口**: Web 应用运行在 `http://localhost:3001`
- **HMR**: Vite 提供热模块替换，代码更改自动刷新
- **数据库 Studio**: 运行 `bun run db:studio` 打开可视化数据库管理界面
- **React DevTools**: 已集成，可通过浏览器插件查看组件树
- **TanStack DevTools**: 右下角显示路由和查询状态（开发模式）

## 相关资源

- [Better-T-Stack 文档](https://github.com/AmanVarshney01/create-better-t-stack)
- [TanStack Router 文档](https://tanstack.com/router/latest)
- [oRPC 文档](https://orpc.unnoq.com/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Better-Auth 文档](https://www.better-auth.com/docs)
