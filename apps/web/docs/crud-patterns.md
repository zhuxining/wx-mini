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
import { authClient } from '@/lib/auth-client'
import { requireActiveOrganization } from '@/utils/guards'

export const Route = createFileRoute('/org/members/')({
  beforeLoad: async ({ context, location }) => {
    await requireActiveOrganization({ context, location })
  },
  component: MembersList,
})

function MembersList() {
  const queryClient = useQueryClient()

  // 获取 session 和组织 ID
  const { data: session } = useSuspenseQuery(
    orpc.privateData.queryOptions()
  )

  const organizationId = (session?.user as {
    activeOrganizationId?: string | null
  })?.activeOrganizationId

  // 成员列表查询
  const { data: membersData, refetch: refetchMembers } = useSuspenseQuery({
    queryKey: ['organization', 'members', organizationId],
    queryFn: async () => {
      if (!organizationId) return { members: [] }
      return authClient.organization.listMembers({
        query: { organizationId },
      })
    },
  })

  // 类型断言处理 Better-Auth 返回类型
  const members = (membersData as unknown as
    { members?: unknown[] } | null
  )?.members ?? []

  // 删除 mutation
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      return authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      })
    },
    onSuccess: () => {
      refetchMembers()
    },
  })

  const handleDelete = (memberId: string) => {
    if (confirm('Are you sure?')) {
      removeMember.mutate(memberId)
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
          {members.map((member: unknown) => {
            const m = member as {
              id: string
              user: { name: string; email: string }
              role: string
            }
            return (
              <TableRow key={m.id}>
                <TableCell>{m.user.name}</TableCell>
                <TableCell>{m.user.email}</TableCell>
                <TableCell>
                  <Badge>{m.role}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <EditButton member={m} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
```

### 带搜索和筛选的列表

```typescript
function MembersList() {
  const { data: session } = useSuspenseQuery(
    orpc.privateData.queryOptions()
  )

  const organizationId = (session?.user as {
    activeOrganizationId?: string | null
  })?.activeOrganizationId

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<'all' | 'admin' | 'member'>('all')

  const { data: membersData } = useSuspenseQuery({
    queryKey: ['organization', 'members', organizationId, { search, role }],
    queryFn: async () => {
      if (!organizationId) return { members: [] }
      const result = await authClient.organization.listMembers({
        query: { organizationId },
      })

      // 客户端过滤（Better-Auth API 不支持搜索参数）
      let members = (result as unknown as { members?: unknown[] } | null)
        ?.members ?? []

      if (search) {
        members = members.filter((m: unknown) => {
          const member = m as { user: { name?: string; email?: string } }
          return (
            member.user.name?.toLowerCase().includes(search.toLowerCase()) ||
            member.user.email?.toLowerCase().includes(search.toLowerCase())
          )
        })
      }

      if (role !== 'all') {
        members = members.filter((m: unknown) => {
          const member = m as { role: string }
          return member.role === role
        })
      }

      return { members }
    },
  })

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

## DataTable 模式

### 概述

`DataTable` 是项目自定义的基于 TanStack Table 的高性能数据表格组件，提供了完整的数据展示、分页、排序和过滤功能。

**导入**:

```typescript
import { DataTable } from '@/components/data-table/data-table'
import { useDataTable } from '@/hooks/use-data-table'
```

**核心功能**:

- 分页（URL 同步，支持书签）
- 排序（单列/多列）
- 过滤（文本、数字、范围、日期、多选）
- 列可见性控制
- 行选择
- 列固定

### 基础用法

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { DataTable } from '@/components/data-table/data-table'
import { useDataTable } from '@/hooks/use-data-table'
import { columns } from './columns'

export const Route = createFileRoute('/org/members/')({
  component: MembersList,
})

function MembersList() {
  const { data: session } = useSuspenseQuery(
    orpc.privateData.queryOptions()
  )
  const organizationId = session?.user?.activeOrganizationId

  // 获取数据
  const { data: membersData, pageCount } = useSuspenseQuery({
    queryKey: ['organization', 'members', organizationId, page, perPage, sort],
    queryFn: async () => {
      const response = await fetch(`/api/members?page=${page}&perPage=${perPage}`)
      return response.json()
    },
  })

  // 使用 hook 配置表格
  const table = useDataTable({
    columns,
    pageCount,
    data: membersData?.members ?? [],
  })

  return <DataTable table={table} />
}
```

### 带工具栏的完整用法

```typescript
import {
  DataTableToolbar,
  DataTablePagination,
  DataTableViewOptions,
} from '@/components/data-table'

function MembersList() {
  const table = useDataTable({
    columns,
    pageCount,
    data: membersData?.members ?? [],
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table}>
        <DataTableViewOptions table={table} />
      </DataTableToolbar>

      <DataTable table={table} />

      <DataTablePagination table={table} />
    </div>
  )
}
```

### 列定义示例

```typescript
// columns.tsx
import { columnFactory } from '@/components/data-table/column-factory'

export const columns = [
  // 文本列（支持搜索过滤）
  columnFactory.accessor('name', {
    header: 'Name',
    enableColumnFilter: true,
  }),

  // 选择列（多选过滤）
  columnFactory.accessor('role', {
    header: 'Role',
    enableColumnFilter: true,
    meta: {
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Member', value: 'member' },
      ],
    },
    cell: ({ row }) => (
      <Badge>{row.original.role}</Badge>
    ),
  }),

  // 日期列（支持日期过滤）
  columnFactory.accessor('createdAt', {
    header: 'Created',
    enableColumnFilter: true,
    cell: ({ row }) => formatDate(row.original.createdAt),
  }),

  // 操作列
  columnFactory.display({
    id: 'actions',
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <EditButton member={row.original} />
        <DeleteButton memberId={row.original.id} />
      </div>
    ),
  }),
]
```

### 子组件

**DataTableToolbar** - 工具栏容器

```typescript
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'

<DataTableToolbar table={table}>
  <DataTableViewOptions table={table} />
  <DataTableFacetedFilter column={table.getColumn('status')} />
  <DataTableDateFilter column={table.getColumn('createdAt')} />
</DataTableToolbar>
```

**DataTableFacetedFilter** - 多选过滤

```typescript
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter'

<DataTableFacetedFilter
  column={table.getColumn('role')}
  title="Role"
  options={[
    { label: 'Admin', value: 'admin', icon: Shield },
    { label: 'Member', value: 'member', icon: User },
  ]}
/>
```

**DataTableDateFilter** - 日期范围过滤

```typescript
import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter'

<DataTableDateFilter
  column={table.getColumn('createdAt')}
  title="Created Date"
/>
```

**DataTableSliderFilter** - 数值范围过滤

```typescript
import { DataTableSliderFilter } from '@/components/data-table/data-table-slider-filter'

<DataTableSliderFilter
  column={table.getColumn('age')}
  title="Age"
  min={0}
  max={100}
/>
```

**DataTableSkeleton** - 骨架屏加载

```typescript
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton'

if (isLoading) {
  return <DataTableSkeleton columnCount={5} rowCount={10} />
}
```

### 配置

**自定义 URL 参数键**:

```typescript
const table = useDataTable({
  columns,
  pageCount,
  data,
  queryKeys: {
    page: 'p',
    perPage: 'size',
    sort: 'sortBy',
    filters: 'filter',
  },
})
```

**禁用 URL 同步**:

```typescript
const table = useDataTable({
  columns,
  pageCount,
  data,
  history: 'push', // 或 'replace'
})
```

### 参考文档

- TanStack Table: <https://tanstack.com/table/latest>
- 类型定义: `src/types/data-table.ts`
- 配置文件: `src/config/data-table.ts`

---

## DataGrid 模式

### 概述

`DataGrid` 是项目自定义的虚拟滚动可编辑表格组件，适用于大数据集的展示和编辑。

**导入**:

```typescript
import { DataGrid } from '@/components/data-grid/data-grid'
import { useDataGrid } from '@/hooks/use-data-grid'
```

**核心功能**:

- 虚拟滚动（高性能渲染大数据集）
- 单元格编辑
- 键盘导航（箭头键、Tab、Enter）
- 复制粘贴支持
- 搜索（快捷键 F）
- 右键菜单
- 行高度设置
- 排序和过滤

### 基础用法

```typescript
import { DataGrid } from '@/components/data-grid/data-grid'
import { useDataGrid } from '@/hooks/use-data-grid'
import { columns } from './columns'

function Spreadsheet() {
  const [data, setData] = useState(initialData)

  const table = useDataGrid({
    data,
    columns,
    onDataChange: setData,
  })

  return <DataGrid table={table} />
}
```

### 列定义示例

```typescript
import { columnFactory } from '@/components/data-grid/column-factory'

export const columns = [
  // 文本列
  columnFactory.accessor('name', {
    header: 'Name',
  }),

  // 数字列
  columnFactory.accessor('age', {
    header: 'Age',
    type: 'number',
  }),

  // 选择列
  columnFactory.accessor('status', {
    header: 'Status',
    type: 'select',
    meta: {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  }),

  // 日期列
  columnFactory.accessor('date', {
    header: 'Date',
    type: 'date',
  }),

  // 复选框列
  columnFactory.accessor('enabled', {
    header: 'Enabled',
    type: 'boolean',
  }),
]
```

### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑↓←→` | 移动单元格焦点 |
| `Tab` | 移动到下一列 |
| `Enter` | 编辑单元格 / 确认编辑 |
| `Esc` | 取消编辑 |
| `F` | 聚焦搜索框 |
| `Ctrl+C` | 复制选中单元格 |
| `Ctrl+V` | 粘贴到选中区域 |

### 子组件

**DataGridSearch** - 搜索框

```typescript
import { DataGridSearch } from '@/components/data-grid/data-grid-search'

<DataGridSearch table={table} />
```

**DataGridContextMenu** - 右键菜单

```typescript
import { DataGridContextMenu } from '@/components/data-grid/data-grid-context-menu'

<DataGridContextMenu table={table}>
  <MenuItem onClick={handleCopy}>Copy</MenuItem>
  <MenuItem onClick={handlePaste}>Paste</MenuItem>
</DataGridContextMenu>
```

**DataGridKeyboardShortcuts** - 快捷键帮助

```typescript
import { DataGridKeyboardShortcuts } from '@/components/data-grid/data-grid-keyboard-shortcuts'

<DataGridKeyboardShortcuts />
```

### 参考文档

- 类型定义: `src/types/data-grid.ts`
- 单元格变体: `src/components/data-grid/data-grid-cell-variants.tsx`

---

## 创建对话框模式

### 基础创建对话框

**何时使用**: 需要收集用户输入来创建新资源

```typescript
import { toast } from 'sonner'

function CreateMemberDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { data: session } = useSuspenseQuery(
    orpc.privateData.queryOptions()
  )

  const organizationId = (session?.user as {
    activeOrganizationId?: string | null
  })?.activeOrganizationId

  const inviteMember = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      if (!organizationId) throw new Error('No active organization')
      return authClient.organization.inviteMember({
        email: data.email,
        role: data.role as 'admin' | 'member',
        organizationId,
      })
    },
    onSuccess: () => {
      toast.success('Invitation sent successfully')
      setIsOpen(false)
      queryClient.invalidateQueries({
        queryKey: ['organization', 'members', organizationId],
      })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation')
    },
  })

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
          onSubmit={(data) => inviteMember.mutate(data)}
          isSubmitting={inviteMember.isPending}
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
import { toast } from 'sonner'

function EditableMemberRow({
  member,
  organizationId,
}: {
  member: { id: string; user: { name: string; email: string }; role: string }
  organizationId: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const queryClient = useQueryClient()

  const updateRole = useMutation({
    mutationFn: async (role: string) => {
      return authClient.organization.updateMemberRole({
        memberId: member.id,
        role: role as 'admin' | 'member',
      })
    },
    onSuccess: () => {
      toast.success('Role updated successfully')
      setIsEditing(false)
      queryClient.invalidateQueries({
        queryKey: ['organization', 'members', organizationId],
      })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update role')
    },
  })

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>{member.user.name}</TableCell>
        <TableCell>{member.user.email}</TableCell>
        <TableCell>
          <Select
            value={member.role}
            onValueChange={(role) => updateRole.mutate(role)}
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
import { toast } from 'sonner'

function EditMemberDialog({
  member,
  organizationId,
}: {
  member: { id: string; user: { name: string; email: string }; role: string }
  organizationId: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const updateMember = useMutation({
    mutationFn: async (data: { role: string }) => {
      return authClient.organization.updateMemberRole({
        memberId: member.id,
        role: data.role as 'admin' | 'member',
      })
    },
    onSuccess: () => {
      toast.success('Member updated successfully')
      setIsOpen(false)
      queryClient.invalidateQueries({
        queryKey: ['organization', 'members', organizationId],
      })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update member')
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
          <DialogTitle>Edit Member</DialogTitle>
        </DialogHeader>

        <MemberForm
          defaultValues={member}
          onSubmit={(data) => updateMember.mutate(data)}
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
import { toast } from 'sonner'

function DeleteButton({
  memberId,
  memberName,
  organizationId,
}: {
  memberId: string
  memberName: string
  organizationId: string
}) {
  const queryClient = useQueryClient()

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      return authClient.organization.removeMember({
        memberIdOrEmail: id,
      })
    },
    onSuccess: () => {
      toast.success('Member removed successfully')
      queryClient.invalidateQueries({
        queryKey: ['organization', 'members', organizationId],
      })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove member')
    },
  })

  const handleDelete = () => {
    if (confirm(`Remove ${memberName}?`)) {
      removeMember.mutate(memberId)
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
import { toast } from 'sonner'

function DeleteConfirmButton({
  member,
  organizationId,
}: {
  member: { id: string; user: { name: string } }
  organizationId: string
}) {
  const queryClient = useQueryClient()

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      return authClient.organization.removeMember({
        memberIdOrEmail: id,
      })
    },
    onSuccess: () => {
      toast.success('Member removed successfully')
      queryClient.invalidateQueries({
        queryKey: ['organization', 'members', organizationId],
      })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove member')
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
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {member.user.name}? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => removeMember.mutate(member.id)}
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
import { orpc } from '@/utils/orpc'

// 失效单个查询（成员列表）
queryClient.invalidateQueries({
  queryKey: ['organization', 'members', organizationId],
})

// 失效多个相关查询（所有组织相关）
queryClient.invalidateQueries({
  queryKey: ['organization'],
})

// 失效 Session 查询
queryClient.invalidateQueries({
  queryKey: orpc.privateData.queryOptions().queryKey,
})

// 设置查询数据（乐观更新）
queryClient.setQueryData(
  ['organization', 'members', organizationId],
  (old: { members: unknown[] } | undefined) => ({
    members: [...(old?.members ?? []), newMember],
  })
)
```

### 乐观更新模式

**何时使用**: 用户交互频繁、需要即时反馈的场景
**何时不使用**: 数据一致性要求高、操作不可逆

```typescript
const removeMember = useMutation({
  mutationFn: async (memberId: string) => {
    return authClient.organization.removeMember({
      memberIdOrEmail: memberId,
    })
  },
  onMutate: async (memberId) => {
    // 取消相关查询
    await queryClient.cancelQueries({
      queryKey: ['organization', 'members', organizationId],
    })

    // 保存当前数据
    const previousData = queryClient.getQueryData(
      ['organization', 'members', organizationId]
    )

    // 乐观更新
    queryClient.setQueryData(
      ['organization', 'members', organizationId],
      (old: unknown) => {
        const data = old as { members?: unknown[] } | null
        return {
          members: data?.members?.filter(
            (m: unknown) => (m as { id: string }).id !== memberId
          ) ?? [],
        }
      }
    )

    return { previousData }
  },
  onError: (error, memberId, context) => {
    // 回滚
    if (context?.previousData) {
      queryClient.setQueryData(
        ['organization', 'members', organizationId],
        context.previousData
      )
    }
  },
  onSettled: () => {
    // 无论成功失败都刷新
    queryClient.invalidateQueries({
      queryKey: ['organization', 'members', organizationId],
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
- [diceui](https://www.diceui.com/docs/)
