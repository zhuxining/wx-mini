# 表单模式详解

## 概述

本文档详细说明了使用 TanStack Form 和 Zod 构建类型安全表单的最佳实践和模式。

---

## 核心技术栈

- **@tanstack/react-form** - 类型安全的表单状态管理
- **zod** - Schema 验证和类型推断
- **shadcn/ui** - UI 组件库 (Input, Button, Label 等)
- **sonner** - Toast 通知

---

## 标准表单结构

### 基础模板

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
        email: z.string().email("Invalid email format"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
      }),
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-4">
      {/* 表单字段 */}
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Email</Label>
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

      {/* 提交按钮 */}
      <form.Subscribe>
        {(state) => (
          <Button
            type="submit"
            disabled={!state.canSubmit || state.isSubmitting}
            className="w-full"
          >
            {state.isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

---

## 表单字段模式

### 文本输入

```typescript
<form.Field name="name">
  {(field) => (
    <div className="space-y-2">
      <Label htmlFor={field.name}>Name</Label>
      <Input
        id={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="John Doe"
      />
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-red-500">
          {field.state.meta.errors[0]?.message}
        </p>
      )}
    </div>
  )}
</form.Field>
```

### 邮箱输入

```typescript
<form.Field name="email">
  {(field) => (
    <div className="space-y-2">
      <Label htmlFor={field.name}>Email</Label>
      <Input
        id={field.name}
        type="email"
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="user@example.com"
        autoComplete="email"
      />
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-red-500">
          {field.state.meta.errors[0]?.message}
        </p>
      )}
    </div>
  )}
</form.Field>
```

### 密码输入

```typescript
<form.Field name="password">
  {(field) => (
    <div className="space-y-2">
      <Label htmlFor={field.name}>Password</Label>
      <Input
        id={field.name}
        type="password"
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
      />
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-red-500">
          {field.state.meta.errors[0]?.message}
        </p>
      )}
    </div>
  )}
</form.Field>
```

### 选择框 (Select)

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<form.Field name="role">
  {(field) => (
    <div className="space-y-2">
      <Label htmlFor={field.name}>Role</Label>
      <Select
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="member">Member</SelectItem>
        </SelectContent>
      </Select>
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-red-500">
          {field.state.meta.errors[0]?.message}
        </p>
      )}
    </div>
  )}
</form.Field>
```

### 复选框 (Checkbox)

```typescript
import { Checkbox } from "@/components/ui/checkbox";

<form.Field name="agree">
  {(field) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked)}
      />
      <Label htmlFor={field.name}>I agree to the terms</Label>
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-red-500">
          {field.state.meta.errors[0]?.message}
        </p>
      )}
    </div>
  )}
</form.Field>
```

### 文本域 (Textarea)

```typescript
import { Textarea } from "@/components/ui/textarea";

<form.Field name="bio">
  {(field) => (
    <div className="space-y-2">
      <Label htmlFor={field.name}>Bio</Label>
      <Textarea
        id={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="Tell us about yourself..."
        rows={4}
      />
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-red-500">
          {field.state.meta.errors[0]?.message}
        </p>
      )}
    </div>
  )}
</form.Field>
```

---

## Zod 验证规则

### 基础验证

```typescript
validators: {
  onSubmit: z.object({
    // 必填字段
    name: z.string().min(1, "Name is required"),

    // 最小长度
    name: z.string().min(2, "Name must be at least 2 characters"),

    // 最大长度
    name: z.string().max(50, "Name must be less than 50 characters"),

    // 邮箱验证
    email: z.string().email("Invalid email format"),

    // 可选字段
    bio: z.string().optional(),

    // 可为空
    bio: z.string().nullable().optional(),

    // 默认值
    role: z.string().default("member"),
  }),
}
```

### 高级验证

```typescript
validators: {
  onSubmit: z.object({
    // 密码验证
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number")
      .regex(/[^A-Za-z0-9]/, "Must contain special character"),

    // 枚举验证
    role: z.enum(["admin", "member"], {
      errorMap: () => ({ message: "Invalid role" }),
    }),

    // 数组验证
    tags: z.array(z.string()).min(1, "Select at least one tag"),

    // 数字验证
    age: z.number().min(18, "Must be 18 or older").max(120, "Invalid age"),

    // URL 验证
    website: z.string().url("Invalid URL"),

    // 日期验证
    birthDate: z.string().refine((date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }, "Invalid date"),

    // 自定义验证
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .refine((val) => /^[a-zA-Z0-9_]+$/.test(val), {
        message: "Only letters, numbers, and underscores allowed",
      }),
  }),
}
```

### 对象验证

```typescript
validators: {
  onSubmit: z.object({
    // 嵌套对象
    address: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      zipCode: z.string().regex(/^\d{5}$/, "Invalid ZIP code"),
    }),

    // 联系方式（至少填写一个）
    contact: z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }).refine((data) => data.email || data.phone, {
      message: "Either email or phone is required",
    }),
  }),
}
```

---

## 提交按钮模式

### 基础提交按钮

```typescript
<form.Subscribe>
  {(state) => (
    <Button
      type="submit"
      disabled={!state.canSubmit || state.isSubmitting}
      className="w-full"
    >
      {state.isSubmitting ? "Submitting..." : "Submit"}
    </Button>
  )}
</form.Subscribe>
```

### 带加载状态的按钮

```typescript
<form.Subscribe>
  {(state) => (
    <Button
      type="submit"
      disabled={!state.canSubmit || state.isSubmitting}
      className="w-full"
    >
      {state.isSubmitting ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Save Changes"
      )}
    </Button>
  )}
</form.Subscribe>
```

### 双按钮模式

```typescript
<div className="flex gap-2">
  <Button
    type="button"
    variant="outline"
    onClick={onCancel}
    disabled={isSubmitting}
  >
    Cancel
  </Button>

  <form.Subscribe>
    {(state) => (
      <Button
        type="submit"
        disabled={!state.canSubmit || state.isSubmitting}
      >
        {state.isSubmitting ? "Saving..." : "Save"}
      </Button>
    )}
  </form.Subscribe>
</div>
```

---

## 表单状态处理

### 错误处理

```typescript
const form = useForm({
  onSubmit: async ({ value }) => {
    try {
      const response = await api.submit(value);
      toast.success("Submitted successfully");
    } catch (error) {
      // API 错误
      if (error instanceof APIError) {
        toast.error(error.message);
        return;
      }

      // 验证错误
      if (error instanceof ValidationError) {
        // 设置字段错误
        error.fields.forEach((fieldError) => {
          form.setFieldMeta(fieldError.field, (meta) => ({
            ...meta,
            errors: [fieldError.message],
          }));
        });
        return;
      }

      // 未知错误
      toast.error("An unexpected error occurred");
    }
  },
});
```

### 成功后处理

```typescript
const form = useForm({
  onSubmit: async ({ value }) => {
    const response = await api.submit(value);

    toast.success("Success!");

    // 重置表单
    form.reset();

    // 或重定向
    navigate({ to: "/success" });

    // 或触发回调
    onSuccess?.(response);
  },
});
```

### 加载状态

```typescript
function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        await api.submit(value);
        toast.success("Success!");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* 字段 */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```

---

## 对话框表单

### 创建对话框表单

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <DialogContent>
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
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const form = useForm({
    onSubmit: async ({ value }) => {
      await api.create(value);
      toast.success("Created successfully");
      onSuccess();
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-4">
      {/* 字段 */}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Creating..." : "Create"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </form>
  );
}
```

---

## 相关文档

- **组件模式详解**: [docs/component-patterns.md](../../docs/component-patterns.md)
- **shadcn/ui 组件**: [https://ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
- **TanStack Form 文档**: [https://tanstack.com/form/latest](https://tanstack.com/form/latest)
- **Zod 文档**: [https://zod.dev/](https://zod.dev/)
