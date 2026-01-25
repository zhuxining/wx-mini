# 组件模式详解

## 概述

本文档详细说明了 React 组件开发的最佳实践和模式，包括 CRUD 页面、表单验证、数据加载和用户反馈。

---

## CRUD 页面模式

### 标准结构

**参考文件**: [apps/web/src/routes/admin/organizations/index.tsx](../apps/web/src/routes/admin/organizations/index.tsx)

**完整实现**:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";
import { toast } from "sonner";
import { Loader } from "@/components/loader";
import { TableSkeleton } from "@/components/ui/skeleton";

function CRUDPage() {
  // 1. 数据查询
  const { data, isLoading, error } = useQuery(
    orpc.organization.listOrganizations.queryOptions()
  );

  // 2. 变更操作
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    orpc.organization.createOrganization.mutationOptions({
      onSuccess: () => {
        toast.success("Created successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listOrganizations.key(),
        });
      },
      onError: (err: Error) => {
        toast.error(`Failed: ${err.message}`);
      },
    })
  );

  const deleteMutation = useMutation(
    orpc.organization.deleteOrganization.mutationOptions({
      onSuccess: () => {
        toast.success("Deleted successfully");
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listOrganizations.key(),
        });
      },
      onError: (err: Error) => {
        toast.error(`Failed: ${err.message}`);
      },
    })
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteMutation.mutate({ id });
    }
  };

  // 3. 加载状态
  if (isLoading) {
    return <TableSkeleton />;
  }

  // 4. 错误处理
  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  // 5. 渲染 UI
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <CreateDialog mutation={createMutation} />
      </div>

      <DataTable
        data={data}
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "createdAt", label: "Created" },
        ]}
        actions={(row) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      />
    </div>
  );
}
```

### 关键要点

| 要点 | 说明 |
|------|------|
| **类型安全查询** | 使用 `queryOptions()` 获得端到端类型安全 |
| **变更操作** | 使用 `mutationOptions()` 处理成功/错误 |
| **数据刷新** | 成功后使用 `invalidateQueries` 刷新数据 |
| **用户反馈** | 使用 `toast` (Sonner) 显示操作结果 |
| **加载状态** | 使用 `Skeleton` 组件显示占位符 |

### 状态处理

```typescript
// 1. 加载状态
if (isLoading) {
  return <TableSkeleton />;  // 或 <Loader />
}

// 2. 错误状态
if (error) {
  return (
    <div className="text-red-500 p-4">
      Error: {error.message}
    </div>
  );
}

// 3. 空状态
if (!data || data.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">No items found</p>
      <CreateDialog mutation={createMutation} />
    </div>
  );
}

// 4. 成功状态
return <DataTable data={data} />;
```

---

## 表单模式

### TanStack Form + Zod 验证

**参考文件**: [apps/web/src/components/sign-in-form.tsx](../apps/web/src/components/sign-in-form.tsx)

**完整实现**:

```typescript
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function MyForm({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      // 提交逻辑
      const response = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });

      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      toast.success("Signed in successfully");

      // 成功后重定向
      if (redirect) {
        navigate({ to: redirect });
      }
    },
    validators: {
      onSubmit: z.object({
        email: z
          .string()
          .min(1, "Email is required")
          .email("Invalid email format"),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters"),
        name: z
          .string()
          .min(2, "Name must be at least 2 characters"),
      }),
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit}
      className="space-y-4"
    >
      {/* Email Field */}
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              Email
            </Label>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="user@example.com"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Password Field */}
      <form.Field name="password">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>
              Password
            </Label>
            <Input
              id={field.name}
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors[0]?.message}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Submit Button */}
      <form.Subscribe>
        {(state) => (
          <Button
            type="submit"
            disabled={!state.canSubmit || state.isSubmitting}
            className="w-full"
          >
            {state.isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

### 关键要点

| 要点 | 说明 |
|------|------|
| **类型安全表单** | 使用 `@tanstack/react-form` 管理表单状态 |
| **Zod 验证** | 使用 `zod` 定义验证规则，类型自动推断 |
| **Field 组件** | 使用 `form.Field` 渲染表单字段，自动管理状态 |
| **Subscribe 组件** | 使用 `form.Subscribe` 订阅表单状态 |
| **提交按钮** | 禁用条件：`!state.canSubmit \|\| state.isSubmitting` |

### 表单验证规则

```typescript
// 常用验证规则
validators: {
  onSubmit: z.object({
    // 必填字段
    name: z.string().min(1, "Name is required"),

    // 邮箱验证
    email: z.string().email("Invalid email format"),

    // 密码验证
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[0-9]/, "Must contain number"),

    // 可选字段
    bio: z.string().optional(),

    // 枚举验证
    role: z.enum(["admin", "member"]),

    // 数组验证
    tags: z.array(z.string()).min(1, "Select at least one tag"),
  }),
}
```

---

## 数据加载模式

### TanStack Query

**定义查询选项** (可复用):

```typescript
const getTeamsOptions = (organizationId: string) =>
  orpc.organization.listTeams.queryOptions({ organizationId });
```

**在组件中使用**:

```typescript
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";

function TeamsList() {
  const { data: session } = useSession();
  const orgId = session?.user?.activeOrganizationId || "";

  const { data, isLoading, error, refetch } = useQuery(
    getTeamsOptions(orgId)
  );

  // 加载状态
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error: {error.message}
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  // 成功状态
  return (
    <div className="grid gap-4">
      {data?.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
```

### 加载状态处理

**方案 1: Skeleton (推荐)**

```typescript
if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-3/4" />
    </div>
  );
}
```

**方案 2: Loader 组件**

```typescript
if (isLoading) {
  return <Loader />;
}
```

**方案 3: 全屏加载**

```typescript
if (isLoading) {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader />
    </div>
  );
}
```

---

## Toast 通知模式

### Sonner 使用

**基础用法**:

```typescript
import { toast } from "sonner";

// 成功通知
toast.success("Operation completed successfully");

// 错误通知
toast.error("Something went wrong");

// 信息通知
toast.info("Processing your request");

// 警告通知
toast.warning("This action cannot be undone");
```

### 高级用法

**带操作的通知**:

```typescript
toast.success("Changes saved", {
  action: {
    label: "Undo",
    onClick: () => undoChanges(),
  },
});
```

**Promise 状态** (自动处理加载/成功/错误):

```typescript
toast.promise(
  saveChanges(),
  {
    loading: "Saving...",
    success: "Saved successfully",
    error: "Failed to save",
  }
);
```

**自定义持续时间**:

```typescript
toast.success("This will disappear in 10 seconds", {
  duration: 10000, // 10秒
});
```

### 在 Mutation 中使用

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    return await orpc.organization.createOrganization.mutate(data);
  },
  onSuccess: (data) => {
    toast.success(`Organization "${data.name}" created`);
  },
  onError: (error: Error) => {
    toast.error(`Failed: ${error.message}`, {
      action: {
        label: "Retry",
        onClick: () => mutation.mutate(data),
      },
    });
  },
});
```

---

## 对话框模式

### 创建/编辑对话框

**完整实现**:

```typescript
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function CreateDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Item</DialogTitle>
          <DialogDescription>
            Enter the details for the new item.
          </DialogDescription>
        </DialogHeader>

        <CreateForm
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 删除确认对话框

**方案 1: 原生 confirm (简单)**

```typescript
function DeleteButton({ id, name }: { id: string; name: string }) {
  const deleteMutation = useMutation(/* ... */);

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
```

**方案 2: AlertDialog (shadcn/ui)**

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function DeleteButton({ id, name }: { id: string; name: string }) {
  const deleteMutation = useMutation(/* ... */);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete
            the item and all related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ id })}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Session 获取模式

### 使用 authClient

**在组件中获取 session**:

```typescript
import { authClient } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <Loader />;
  if (!session) return <div>Not authenticated</div>;

  const user = session.user;
  const orgId = user?.activeOrganizationId || "";

  return <div>Welcome {user.name}</div>;
}
```

### 使用 oRPC

**在路由 loader 中**:

```typescript
import { orpc } from "@/utils/orpc";
import { defer } from "react-router-dom";

export const loader = async () => {
  const session = await orpc.privateData.query();
  return defer({ session });
};
```

**在组件中**:

```typescript
import { useLoaderData } from "@tanstack/react-router";

const { data: session } = await useLoaderData({
  from: "/org/dashboard",
}).session;
```

---

## 相关文档

- **组件开发规范**: [apps/web/src/components/CLAUDE.md](../apps/web/src/components/CLAUDE.md)
- **表单模式详解**: [apps/web/docs/form-patterns.md](../apps/web/docs/form-patterns.md)
- **数据加载详解**: [apps/web/docs/data-loading.md](../apps/web/docs/data-loading.md)
- **shadcn/ui 组件**: [https://ui.shadcn.com/](https://ui.shadcn.com/)
