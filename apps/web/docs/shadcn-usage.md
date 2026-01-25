# shadcn/ui 使用指南

## 概述

本文档说明了 shadcn/ui 组件库的使用方法、添加组件流程和定制方法。

---

## 核心概念

shadcn/ui 不是传统的组件库，而是一组可复制粘贴的组件集合。组件直接添加到你的项目中，你可以完全控制代码。

---

## 添加新组件

### 使用 CLI 添加

```bash
bunx shadcn@latest add [component-name]
```

### 常用组件

```bash
# 基础组件
bunx shadcn@latest add button
bunx shadcn@latest add input
bunx shadcn@latest add label
bunx shadcn@latest add card

# 布局组件
bunx shadcn@latest add dialog
bunx shadcn@latest add sheet
bunx shadcn@latest add sidebar
bunx shadcn@latest add separator

# 数据展示
bunx shadcn@latest add table
bunx shadcn@latest add badge
bunx shadcn@latest add avatar

# 反馈组件
bunx shadcn@latest add toast
bunx shadcn@latest add alert
bunx shadcn@latest add skeleton
```

---

## 已使用的组件

### 基础组件

- `button` - 按钮
- `card` - 卡片容器
- `input` - 输入框
- `label` - 标签
- `select` - 选择框
- `textarea` - 文本域
- `checkbox` - 复选框
- `radio-group` - 单选框组

### 布局组件

- `dialog` - 对话框
- `sheet` - 侧边抽屉
- `sidebar` - 侧边栏
- `collapsible` - 折叠面板
- `separator` - 分隔线
- `breadcrumb` - 面包屑导航

### 数据展示

- `table` - 表格
- `avatar` - 头像
- `badge` - 徽章
- `tooltip` - 工具提示
- `dropdown-menu` - 下拉菜单

### 反馈组件

- `skeleton` - 骨架屏（加载状态）
- `sonner` - Toast 通知
- `alert` - 警告提示
- `alert-dialog` - 确认对话框

---

## 组件使用规范

### 不要编辑 UI 文件

`src/components/ui/` 目录中的文件由 shadcn CLI 自动生成，**不要直接编辑**。如需修改：

1. 使用 `shadcn add [component]` 重新生成
2. 创建包装组件进行定制

### 组件导入

```typescript
// 从 ui 目录导入
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
```

---

## 常用组件组合模式

### 表单字段

```typescript
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

function FormField({ name, label }: { name: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} />
    </div>
  )
}
```

### 对话框表单

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

function FormDialog() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
        {/* 表单内容 */}
        <DialogFooter>
          <Button type="submit">Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 表格操作列

```typescript
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

function TableActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 组件定制

### 创建变体

```typescript
// components/ui/button-variants.tsx
import { Button } from '@/components/ui/button'

export function PrimaryButton({ children, ...props }: ButtonProps) {
  return <Button variant="default" size="default" {...props}>{children}</Button>
}

export function GhostButton({ children, ...props }: ButtonProps) {
  return <Button variant="ghost" size="sm" {...props}>{children}</Button>
}
```

### 组合组件

```typescript
// components/form-field.tsx
import { Label } from '@/components/ui/label'
import { Input, InputProps } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormFieldProps extends InputProps {
  label: string
  error?: string
}

export function FormField({ label, error, className, ...props }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{label}</Label>
      <Input
        className={cn(error && 'border-destructive')}
        {...props}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

---

## 主题定制

### 颜色变量

在 `app/globals.css` 中修改 CSS 变量：

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... 其他变量 */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... 暗色模式变量 */
  }
}
```

### 组件默认样式

使用 `cn()` 工具合并 Tailwind 类：

```typescript
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function CustomButton({ className, ...props }) {
  return (
    <Button
      className={cn('rounded-full px-6', className)}
      {...props}
    />
  )
}
```

---

## 常见问题

### 组件未找到

确保组件已添加到项目中：

```bash
bunx shadcn@latest add [component-name]
```

### 样式不生效

检查：

1. `globals.css` 是否正确导入
2. Tailwind 配置是否包含组件路径
3. CSS 变量是否正确定义

### TypeScript 类型错误

运行类型检查：

```bash
bunx tsgo --noEmit
```

---

## 相关资源

- **UI 交互模式**: [docs/ui-patterns.md](./ui-patterns.md)
- **CRUD 模式**: [docs/crud-patterns.md](./crud-patterns.md)
- [shadcn/ui 官方文档](https://ui.shadcn.com/)
- [shadcn/ui 组件展示](https://ui.shadcn.com/docs/components)
