# Web App 文档导航

Web App 开发详细文档索引。

---

## 核心技术栈

| 技术 | 用途 | 详细文档 |
|------|------|----------|
| TanStack Router | 文件系统路由 | routing.md |
| TanStack Query | 数据获取和缓存 | data-loading.md |
| @orpc/tanstack-query | 类型安全的 API 调用 | data-loading.md |
| TanStack Form | 表单状态管理 | form-patterns.md |
| Better-Auth | 认证和授权 | authentication.md |
| shadcn/ui | UI 组件库 | shadcn-usage.md |
| Sonner | Toast 通知 | ui-patterns.md |

---

---

## 快速查找

| 任务 | 文档 |
|------|------|
| 添加新路由 | [routing.md](./routing.md) |
| 路由守卫和权限 | [routing.md](./routing.md) |
| 数据获取和缓存 | [data-loading.md](./data-loading.md) |
| CRUD 页面开发 | [crud-patterns.md](./crud-patterns.md) |
| Toast/对话框交互 | [ui-patterns.md](./ui-patterns.md) |
| 表单开发 | [form-patterns.md](./form-patterns.md) |
| 添加 UI 组件 | [shadcn-usage.md](./shadcn-usage.md) |
| 认证和权限 | [authentication.md](./authentication.md) |

---

## 核心文档

### [routing.md](./routing.md)

**路由系统详解**

TanStack Router 文件系统路由、权限守卫和数据获取模式。

**内容**:

- 文件系统路由基础
- 路由分组与权限矩阵
- 路由守卫详解
- 数据获取模式 (loader + useSuspenseQuery)
- 动态路由参数
- 组件共置规范

**适合**: 添加新路由、实现权限控制、理解数据预加载

---

### [data-loading.md](./data-loading.md)

**数据加载详解**

TanStack Query 数据获取、缓存和状态管理最佳实践。

**内容**:

- QueryClient 全局配置
- 基础查询和查询选项
- SSR 数据预加载
- 加载和错误状态处理
- 数据刷新策略
- 变更操作 (创建/更新/删除)
- 数据缓存策略
- 分页和无限滚动

**适合**: 数据获取、缓存优化、SSR 性能调优

---

### [crud-patterns.md](./crud-patterns.md)

**CRUD 模式详解**

使用 TanStack Query 和 shadcn/ui 构建 CRUD 页面的最佳实践。

**内容**:

- 列表页面模式
- 创建对话框
- 编辑模式 (行内/对话框)
- 删除确认
- 数据刷新和缓存失效
- 乐观更新

**适合**: 构建 CRUD 功能、实现数据操作

---

### [ui-patterns.md](./ui-patterns.md)

**UI 交互模式详解**

shadcn/ui 和 Sonner 构建常见 UI 交互模式的最佳实践。

**内容**:

- Toast 通知模式
- 对话框模式 (创建、编辑、删除)
- 加载状态处理 (Skeleton, Loader)
- 空状态模式
- 错误显示模式
- 确认操作模式

**适合**: 实现用户交互、处理加载和错误状态

---

### [form-patterns.md](./form-patterns.md)

**表单模式详解**

TanStack Form + Zod 构建类型安全表单的最佳实践。

**内容**:

- 标准表单结构
- 表单字段模式 (文本、邮箱、密码、选择等)
- Zod 验证规则
- 提交按钮模式
- 表单状态处理
- 对话框表单

**适合**: 表单开发、数据验证

---

### [authentication.md](./authentication.md)

**认证流程详解**

Better-Auth 的使用方法，包括 Session 管理、组织切换、权限检查等。

**内容**:

- Session 管理
- 登录/登出流程
- 组织切换
- 权限检查
- 邀请流程
- 角色层级 (owner, admin, member)
- 团队系统

**适合**: 实现认证功能、权限控制

---

### [shadcn-usage.md](./shadcn-usage.md)

**shadcn/ui 使用指南**

shadcn/ui 组件库的使用方法、添加组件流程和定制方法。

**内容**:

- 添加新组件
- 已使用的组件清单
- 组件使用规范
- 常用组件组合模式
- 组件定制
- 主题定制

**适合**: 添加 UI 组件、定制样式

---

## 学习路径

### 新手入门

1. 先读 [routing.md](./routing.md) - 了解路由系统
2. 再读 [data-loading.md](./data-loading.md) - 学习数据获取
3. 然后读 [shadcn-usage.md](./shadcn-usage.md) - 熟悉 UI 组件

### 功能开发

1. **CRUD 页面** → [crud-patterns.md](./crud-patterns.md)
2. **表单开发** → [form-patterns.md](./form-patterns.md)
3. **UI 交互** → [ui-patterns.md](./ui-patterns.md)

### 高级主题

1. **认证权限** → [authentication.md](./authentication.md)
2. **性能优化** → [data-loading.md](./data-loading.md) (缓存策略)

---

## 相关资源

### 项目文档

- **主文档**: [../CLAUDE.md](../CLAUDE.md)
- **API 开发**: [packages/api/src/CLAUDE.md](../../packages/api/src/CLAUDE.md)
- **认证包**: [packages/auth/CLAUDE.md](../../packages/auth/CLAUDE.md)
- **数据库**: [packages/db/src/CLAUDE.md](../../packages/db/src/CLAUDE.md)

### 外部资源

- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Router](https://tanstack.com/router/latest)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Form](https://tanstack.com/form/latest)
- [Better-Auth](https://www.better-auth.com/docs)
- [oRPC](https://orpc.unnoq.com/)
