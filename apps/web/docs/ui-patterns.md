# UI 交互模式详解

## 概述

本文档详细说明了使用 shadcn/ui 和 Sonner 构建常见 UI 交互模式的最佳实践。

---

## Toast 通知模式

### 基础 Toast

```typescript
import { toast } from 'sonner'

function SuccessExample() {
  const handleSuccess = () => {
    toast.success('Operation completed successfully')
  }

  return <Button onClick={handleSuccess}>Show Success</Button>
}
```

### 带 Action 的 Toast

```typescript
function ActionToast() {
  const handleUndo = () => {
    // 撤销操作
  }

  toast.success('Item deleted', {
    action: {
      label: 'Undo',
      onClick: handleUndo,
    },
  })
}
```

### Promise 自动处理

```typescript
function PromiseToast() {
  const handleSave = async () => {
    const promise = new Promise((resolve) =>
      setTimeout(() => resolve('Saved!'), 2000)
    )

    toast.promise(promise, {
      loading: 'Saving...',
      success: 'Saved successfully',
      error: 'Failed to save',
    })
  }

  return <Button onClick={handleSave}>Save</Button>
}
```

### 在 Mutation 中使用

```typescript
const createItem = useMutation({
  mutationFn: api.create,
  onSuccess: () => {
    toast.success('Item created successfully')
  },
  onError: (error: Error) => {
    toast.error(`Failed to create: ${error.message}`)
  },
})
```

---

## 对话框模式

### 创建对话框

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

function CreateDialog() {
  const [isOpen, setIsOpen] = useState(false)

  const handleCreate = async (data: FormData) => {
    await api.create(data)
    setIsOpen(false)
    toast.success('Created successfully')
  }

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

        <CreateForm onSubmit={handleCreate} onCancel={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

### 编辑对话框

```typescript
function EditDialog({ item }: { item: Item }) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const updateItem = useMutation({
    mutationFn: api.update,
    onSuccess: () => {
      setIsOpen(false)
      queryClient.invalidateQueries({ queryKey: ['items'] })
      toast.success('Updated successfully')
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <EditForm
          item={item}
          onSubmit={(data) => updateItem.mutate({ id: item.id, data })}
        />
      </DialogContent>
    </Dialog>
  )
}
```

### 删除确认对话框

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
} from '@/components/ui/alert-dialog'

function DeleteConfirmButton({ item }: { item: Item }) {
  const queryClient = useQueryClient()

  const deleteItem = useMutation({
    mutationFn: api.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      toast.success('Deleted successfully')
    },
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{item.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteItem.mutate({ id: item.id })}
            className="bg-destructive text-destructive-foreground"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## 加载状态模式

### Pending 组件

项目提供的 `Pending` 组件用于管理按钮的加载状态，防止重复提交。

**导入**:

```typescript
import { Pending, usePending } from '@/components/pending'
```

**使用方式 1: 组件包装**

```typescript
function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Pending isPending={isPending}>
      <Button disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </Button>
    </Pending>
  )
}
```

**使用方式 2: Hook**

```typescript
function SubmitButton({ isPending }: { isPending: boolean }) {
  const { pendingProps } = usePending({ isPending })

  return (
    <Button {...pendingProps}>
      {isPending ? 'Submitting...' : 'Submit'}
    </Button>
  )
}
```

**在 Mutation 中使用**:

```typescript
function SaveButton() {
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.save(data)
    },
  })

  return (
    <Pending isPending={saveMutation.isPending}>
      <Button disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </Pending>
  )
}
```

**功能特性**:

- 自动禁用交互（点击、键盘事件）
- 设置 ARIA 属性（`aria-busy`、`aria-disabled`）
- 支持 `disabled` prop 传递
- 防止重复提交

### Skeleton 加载

```typescript
import { Skeleton } from '@/components/ui/skeleton'

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-62.5" />
            <Skeleton className="h-4 w-50" />
          </div>
        </div>
      ))}
    </div>
  )
}

// 使用
function ItemsList() {
  const { data, isLoading } = useQuery({ queryKey: ['items'], queryFn: api.list })

  if (isLoading) {
    return <TableSkeleton />
  }

  return <Table data={data} />
}
```

### Spinner 加载

```typescript
import { Loader } from '@/components/loader'

function LoadingExample() {
  const { isPending } = useForm()

  return (
    <Button disabled={isPending}>
      {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? 'Loading...' : 'Submit'}
    </Button>
  )
}
```

### 全屏加载

```typescript
function FullPageLoading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader />
    </div>
  )
}
```

---

## 空状态模式

### 基础空状态

```typescript
function EmptyState() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No items found</h3>
      <p className="text-muted-foreground">
        Get started by creating a new item.
      </p>
      <Button className="mt-4">
        <Plus className="mr-2 h-4 w-4" />
        Create Item
      </Button>
    </div>
  )
}
```

### 搜索空状态

```typescript
function SearchEmptyState({ query }: { query: string }) {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No results for "{query}"</h3>
      <p className="text-muted-foreground">
        Try adjusting your search terms.
      </p>
      <Button variant="outline" className="mt-4" onClick={() => setSearch('')}>
        Clear Search
      </Button>
    </div>
  )
}
```

---

## 错误显示模式

### 错误边界

```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

function ErrorDisplay({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// 使用
function ItemsList() {
  const { data, error, refetch } = useQuery({
    queryKey: ['items'],
    queryFn: api.list,
  })

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => refetch()} />
  }

  return <Table data={data} />
}
```

### 表单错误显示

```typescript
function FormErrors({ errors }: { errors: Record<string, string[]> }) {
  if (Object.keys(errors).length === 0) return null

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Please fix the following errors:</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4">
          {Object.entries(errors).map(([field, messages]) =>
            messages.map((message) => (
              <li key={`${field}-${message}`}>
                {field}: {message}
              </li>
            ))
          )}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
```

---

## 确认操作模式

### 确认按钮状态

```typescript
function ConfirmButton() {
  const [confirmed, setConfirmed] = useState(false)

  const handleDelete = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    // 执行删除
    deleteItem()
  }

  return (
    <Button
      variant={confirmed ? 'destructive' : 'ghost'}
      onClick={handleDelete}
    >
      {confirmed ? 'Confirm Delete' : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
```

### 带延时的确认

```typescript
function DelayedConfirmButton() {
  const [confirming, setConfirming] = useState(false)

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000) // 3秒后重置
      return
    }

    // 执行操作
    deleteItem()
  }

  return (
    <Button
      variant={confirming ? 'destructive' : 'ghost'}
      onClick={handleClick}
      disabled={confirming}
    >
      {confirming ? 'Confirm...' : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
```

---

## 相关文档

- **路由系统详解**: [docs/routing.md](./routing.md)
- **CRUD 模式**: [docs/crud-patterns.md](./crud-patterns.md)
- **表单模式**: [docs/form-patterns.md](./form-patterns.md)
- **数据加载**: [docs/data-loading.md](./data-loading.md)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Sonner 文档](https://sonner.emilkowal.ski/)
- [diceui](https://www.diceui.com/docs/)
