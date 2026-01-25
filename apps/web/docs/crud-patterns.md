# CRUD 模式详解

## 概述

本文档详细说明了使用 TanStack Query 和 shadcn/ui 构建 CRUD 页面的最佳实践和模式。

---

## 列表页面模式

### 标准列表页面

```typescript
import { createFileRoute } from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { orpc } from '@/utils/orpc'
import { requireActiveOrg } from '@/utils/route-guards'

export const Route = createFileRoute('/org/members/')({
  beforeLoad: requireActiveOrg,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        orpc.organization.listMembers.queryOptions({ input: {} })
      ),
    ])
  },
  component: MembersList,
})

function MembersList() {
  const queryClient = useQueryClient()

  // 数据已在 loader 中预取，无加载状态
  const { data: membersData } = useSuspenseQuery(
    orpc.organization.listMembers.queryOptions({ input: {} })
  )

  const members = membersData?.members || []

  // 删除 mutation
  const removeMember = useMutation(
    orpc.organization.removeMember.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listMembers.key(),
        })
      },
    })
  )

  const handleDelete = (memberId: string) => {
    if (confirm('Are you sure?')) {
      removeMember.mutate({ memberId })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Members</h1>
        <CreateMemberDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.user.name}</TableCell>
              <TableCell>{member.user.email}</TableCell>
              <TableCell>
                <Badge>{member.role}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <EditButton member={member} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 带搜索和筛选的列表

```typescript
function MembersList() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<'all' | 'admin' | 'member'>('all')

  const { data: membersData } = useSuspenseQuery(
    orpc.organization.listMembers.queryOptions({
      input: { search, role: role === 'all' ? undefined : role },
    })
  )

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex gap-4">
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 列表 */}
      <Table>...</Table>
    </div>
  )
}
```

---

## 创建对话框模式

### 基础创建对话框

**何时使用**: 需要收集用户输入来创建新资源

```typescript
function CreateMemberDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const createMember = useMutation(
    orpc.organization.inviteMember.mutationOptions({
      onSuccess: () => {
        setIsOpen(false)  // 成功后关闭对话框
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listMembers.key(),
        })
      },
    })
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your organization.
          </DialogDescription>
        </DialogHeader>

        {/* 表单组件 */}
        <MemberForm
          onSubmit={(data) => createMember.mutate(data)}
          isSubmitting={createMember.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
```

**完整的对话框结构** → [ui-patterns.md](./ui-patterns.md#对话框模式)

---

## 编辑模式

### 行内编辑

```typescript
function EditableMemberRow({ member }: { member: Member }) {
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const updateRole = useMutation(
    orpc.organization.updateMemberRole.mutationOptions({
      onSuccess: () => {
        setIsEditing(false)
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listMembers.key(),
        })
      },
    })
  )

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>{member.user.name}</TableCell>
        <TableCell>{member.user.email}</TableCell>
        <TableCell>
          <Select
            value={member.role}
            onValueChange={(role) =>
              updateRole.mutate({ memberId: member.id, role })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-right">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell>{member.user.name}</TableCell>
      <TableCell>{member.user.email}</TableCell>
      <TableCell>
        <Badge>{member.role}</Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
      </TableCell>
    </TableRow>
  )
}
```

### 对话框编辑

```typescript
function EditMemberDialog({ member }: { member: Member }) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const updateMember = useMutation(
    orpc.organization.updateMember.mutationOptions({
      onSuccess: () => {
        setIsOpen(false)
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listMembers.key(),
        })
      },
    })
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>

        <MemberForm
          defaultValues={member}
          onSubmit={(data) => updateMember.mutate({ memberId: member.id, data })}
          isSubmitting={updateMember.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}
```

---

## 删除确认模式

### 基础删除确认

**何时使用**: 快速删除非关键数据

```typescript
function DeleteButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const queryClient = useQueryClient()

  const removeMember = useMutation(
    orpc.organization.removeMember.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listMembers.key(),
        })
      },
    })
  )

  const handleDelete = () => {
    if (confirm(`Remove ${memberName}?`)) {
      removeMember.mutate({ memberId })
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={removeMember.isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
```

### 对话框删除确认

**何时使用**: 删除重要数据，需要明确确认

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

function DeleteConfirmButton({ member }: { member: Member }) {
  const queryClient = useQueryClient()

  const removeMember = useMutation(
    orpc.organization.removeMember.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listMembers.key(),
        })
      },
    })
  )

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {member.user.name}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => removeMember.mutate({ memberId: member.id })}
            className="bg-destructive text-destructive-foreground"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## 数据刷新和缓存失效

### 查询失效策略

```typescript
// 失效单个查询
queryClient.invalidateQueries({
  queryKey: orpc.organization.listMembers.key(),
})

// 失效多个相关查询
queryClient.invalidateQueries({
  queryKey: orpc.organization.key(), // 匹配所有 organization 查询
})

// 设置查询数据（乐观更新）
queryClient.setQueryData(
  orpc.organization.listMembers.key(),
  (old) => [...old, newMember]
)
```

### 乐观更新模式

**何时使用**: 用户交互频繁、需要即时反馈的场景
**何时不使用**: 数据一致性要求高、操作不可逆

```typescript
const removeMember = useMutation({
  mutationFn: orpc.organization.removeMember.mutate,
  onMutate: async (variables) => {
    // 取消相关查询
    await queryClient.cancelQueries({
      queryKey: orpc.organization.listMembers.key(),
    })

    // 保存当前数据
    const previousMembers = queryClient.getQueryData(
      orpc.organization.listMembers.key()
    )

    // 乐观更新
    queryClient.setQueryData(
      orpc.organization.listMembers.key(),
      (old: Member[] | undefined) =>
        old?.filter((m) => m.id !== variables.memberId)
    )

    return { previousMembers }
  },
  onError: (error, variables, context) => {
    // 回滚
    if (context?.previousMembers) {
      queryClient.setQueryData(
        orpc.organization.listMembers.key(),
        context.previousMembers
      )
    }
  },
  onSettled: () => {
    // 无论成功失败都刷新
    queryClient.invalidateQueries({
      queryKey: orpc.organization.listMembers.key(),
    })
  },
})
```

---

## 相关文档

- **路由系统详解**: [docs/routing.md](./routing.md)
- **数据加载详解**: [docs/data-loading.md](./data-loading.md)
- **UI 交互模式**: [docs/ui-patterns.md](./ui-patterns.md)
- **表单模式**: [docs/form-patterns.md](./form-patterns.md)
