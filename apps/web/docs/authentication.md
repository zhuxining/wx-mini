# 认证流程详解

## 概述

本文档详细说明了 Better-Auth 的使用方法，包括 Session 管理、组织切换、权限检查、登录/登出流程和邀请流程。

---

## Session 管理

### 获取 Session

```typescript
import { authClient } from '@/lib/auth-client'

function MyComponent() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return <Loader />
  if (!session) return <div>Not authenticated</div>

  const user = session.user
  const orgId = user?.activeOrganizationId || ''

  return <div>Welcome {user.name}</div>
}
```

### 使用 oRPC 获取 Session

```typescript
import { orpc } from '@/utils/orpc'
import { useQuery } from '@tanstack/react-query'

function MyComponent() {
  const { data: session } = useQuery(orpc.privateData.queryOptions())

  if (!session) return <div>Not authenticated</div>

  return <div>Welcome {session.user.name}</div>
}
```

### Session 结构

```typescript
interface Session {
  user: {
    id: string
    name: string
    email: string
    image?: string
    activeOrganizationId?: string  // 当前活动组织
    activeTeamId?: string           // 当前活动团队
  }
}
```

**注意**: `activeOrganizationId` 属性在运行时由 Better-Auth 动态添加，始终使用可选链：

```typescript
// ✅ 正确
const orgId = session?.user?.activeOrganizationId || ''

// ❌ TypeScript 报错
const orgId = session.user.activeOrganizationId
```

---

## 登录/登出流程

### 登录

```typescript
import { authClient } from '@/lib/auth-client'
import { useNavigate } from '@tanstack/react-router'

function SignInForm() {
  const navigate = useNavigate()

  const handleSignIn = async (email: string, password: string) => {
    const response = await authClient.signIn.email({
      email,
      password,
    })

    if (response.error) {
      toast.error(response.error.message)
      return
    }

    toast.success('Signed in successfully')

    // 登录后重定向
    const redirect = searchParams.get('redirect')
    navigate({ to: redirect || '/org/dashboard' })
  }

  return <Form onSubmit={handleSignIn} />
}
```

### 登出

```typescript
import { authClient } from '@/lib/auth-client'

function SignOutButton() {
  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/' // 强制刷新以清除状态
  }

  return <Button onClick={handleSignOut}>Sign Out</Button>
}
```

### 登录后重定向优先级

1. `redirect` 查询参数
2. 默认: `/org/dashboard` (如果有组织) 或 `/org/select` (如果需要创建/选择组织)

---

## 组织切换

### 切换活跃组织

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { orpc } from '@/utils/orpc'

function OrganizationSwitcher() {
  const queryClient = useQueryClient()

  const { data: session } = useQuery(orpc.privateData.queryOptions())
  const { data: organizations } = useQuery(
    orpc.organization.listOrganizations.queryOptions({ input: {} })
  )

  const setActiveOrg = useMutation({
    mutationFn: authClient.organization.setActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.privateData.key() })
      toast.success('Organization switched')
    },
  })

  return (
    <Select
      value={session?.user?.activeOrganizationId}
      onValueChange={(orgId) => setActiveOrg.mutate({ organizationId: orgId })}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select organization" />
      </SelectTrigger>
      <SelectContent>
        {organizations?.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

---

## 权限检查

### 组织权限检查

```typescript
// 获取用户在组织中的角色
function getOrgRole(session: Session | null, orgId: string): string {
  if (!session?.user?.activeOrganizationId) return 'guest'
  // 从组织成员列表中查找角色
  return 'member' // 或 'admin', 'owner'
}

// 检查是否为组织管理员
function isOrgAdmin(session: Session | null): boolean {
  const role = getOrgRole(session, session?.user?.activeOrganizationId || '')
  return ['admin', 'owner'].includes(role)
}
```

### 路由级权限守卫

```typescript
// utils/route-guards.ts
import { createFileRoute, redirect } from '@tanstack/react-router'

export const requireActiveOrg = async ({ context }: { context: any }) => {
  const session = await context.queryClient.fetchQuery({
    queryKey: ['privateData'],
    queryFn: () => orpc.privateData.query(),
  })

  if (!session?.user?.activeOrganizationId) {
    throw redirect({ to: '/org/create' })
  }
}
```

---

## 邀请流程

### 接受邀请

```typescript
import { useMutation } from '@tanstack/react-query'

function InvitationAcceptPage({ invitationId }: { invitationId: string }) {
  const navigate = useNavigate()

  const acceptInvitation = useMutation(
    orpc.organization.acceptInvitation.mutationOptions({
      onSuccess: () => {
        toast.success('Invitation accepted successfully')
        navigate({ to: '/org/dashboard' })
      },
    })
  )

  const rejectInvitation = useMutation(
    orpc.organization.rejectInvitation.mutationOptions({
      onSuccess: () => {
        toast.success('Invitation rejected')
        navigate({ to: '/' })
      },
    })
  )

  return (
    <div>
      <Button onClick={() => acceptInvitation.mutate({ invitationId })}>
        Accept Invitation
      </Button>
      <Button variant="outline" onClick={() => rejectInvitation.mutate({ invitationId })}>
        Decline
      </Button>
    </div>
  )
}
```

### 未登录用户处理

```typescript
// 检查用户是否登录，未登录则跳转到登录页
function InvitationAcceptPage({ invitationId }: { invitationId: string }) {
  const { data: session } = useQuery(orpc.privateData.queryOptions())

  if (!session) {
    // 未登录，跳转到登录页
    return (
      <Button
        onClick={() =>
          navigate({
            to: '/sign-in',
            search: {
              invitationId,
              redirect: '/invitations/accept/$invitationId',
            },
          })
        }
      >
        Sign In to Accept
      </Button>
    )
  }

  // 已登录，显示邀请详情
  return <InvitationDetails invitationId={invitationId} />
}
```

---

## 角色层级

### 组织角色

| 角色 | 权限 |
|------|------|
| `owner` | 组织所有者，完全控制权 |
| `admin` | 组织管理员，可以管理成员、团队、邀请 |
| `member` | 普通成员，只读访问 |

---

## 团队系统

### 切换活跃团队

```typescript
const setActiveTeam = useMutation(
  orpc.organization.setActiveTeam.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.privateData.key() })
      toast.success('Active team updated')
    },
  })
)
```

### 团队权限

- 团队是组织的子集
- 一个用户可以属于多个团队
- 团队用于更精细的权限管理
- 每个用户有一个活跃团队（`activeTeamId`）

---

## 反模式

- **不要绕过 Better-Auth API** - 使用 authClient，不要手动修改 auth 表
- **不要忽略 activeOrganizationId 类型问题** - 始终使用可选链
- **不要在客户端直接检查密码** - 所有认证逻辑通过 Better-Auth

---

## 相关文档

- **Auth Package**: [packages/auth/CLAUDE.md](../../../packages/auth/CLAUDE.md)
- **路由系统详解**: [docs/routing.md](./routing.md)
- **CRUD 模式**: [docs/crud-patterns.md](./crud-patterns.md)
- [Better-Auth 文档](https://www.better-auth.com/docs)
