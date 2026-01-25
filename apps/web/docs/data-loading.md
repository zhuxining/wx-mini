# 数据加载模式详解

## 概述

本文档详细说明了使用 TanStack Query 进行数据获取、缓存和状态管理的最佳实践。

---

## 基础查询

### 定义查询选项

```typescript
import { orpc } from "@/utils/orpc";

// 可复用的查询选项
const getTeamsOptions = (organizationId: string) =>
  orpc.organization.listTeams.queryOptions({ organizationId });

// 带参数的查询选项
const getMembersOptions = (orgId: string, search?: string) =>
  orpc.organization.listMembers.queryOptions({
    organizationId: orgId,
    search,
  });
```

### 在组件中使用

```typescript
import { useQuery } from "@tanstack/react-query";

function TeamsList() {
  const { data: session } = useSession();
  const orgId = session?.user?.activeOrganizationId || "";

  const { data, isLoading, error, refetch } = useQuery(
    getTeamsOptions(orgId)
  );

  // 加载状态
  if (isLoading) {
    return <TeamsSkeleton />;
  }

  // 错误状态
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => refetch()} />;
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

---

## SSR 数据预加载

### 在路由 loader 中预加载数据

```typescript
import { createFileRoute, defer } from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/org/dashboard")({
  loader: async ({ context }) => {
    const session = await requireAuth({ context });
    const orgId = session?.user?.activeOrganizationId || "";

    // 预加载数据
    const teams = queryClient.ensureQueryData(
      orpc.organization.listTeams.queryOptions({ organizationId: orgId })
    );

    return defer({
      session,
      teams,
    });
  },
  component: OrgDashboard,
});
```

### 在组件中使用预加载的数据

```typescript
import { useLoaderData } from "@tanstack/react-router";

function OrgDashboard() {
  const { teams } = useLoaderData({
    from: "/org/dashboard",
  });

  // 使用 Await 组件处理 deferred 数据
  return (
    <Suspense fallback={<TeamsSkeleton />}>
      <TeamsAwait teams={teams} />
    </Suspense>
  );
}

function TeamsAwait({ teams }: { teams: Promise<Team[]> }) {
  const data = use(teams);

  return (
    <div>
      {data.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
```

---

## 加载状态处理

### Skeleton 模式 (推荐)

```typescript
import { Skeleton } from "@/components/ui/skeleton";

function TeamsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-62.5" />
            <Skeleton className="h-4 w-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 使用
if (isLoading) {
  return <TeamsSkeleton />;
}
```

### Loader 组件模式

```typescript
import { Loader } from "@/components/loader";

if (isLoading) {
  return <Loader />;
}
```

### 全屏加载模式

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

## 错误处理

### 错误状态显示

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
  );
}

// 使用
if (error) {
  return <ErrorDisplay error={error} onRetry={() => refetch()} />;
}
```

### 错误重试

```typescript
const { data, isLoading, error, refetch } = useQuery({
  ...queryOptions,
  retry: 3,              // 自动重试 3 次
  retryDelay: 1000,      // 重试间隔 1 秒
});
```

---

## 数据刷新

### 手动刷新

```typescript
const { data, refetch } = useQuery(queryOptions);

// 手动触发刷新
const handleRefresh = () => {
  refetch();
};

return (
  <div>
    <Button onClick={handleRefresh}>Refresh</Button>
  </div>
);
```

### 自动刷新

```typescript
const { data } = useQuery({
  ...queryOptions,
  refetchInterval: 5000,  // 每 5 秒自动刷新
  refetchIntervalInBackground: true,  // 后台也刷新
});
```

### 窗口聚焦刷新

```typescript
const { data } = useQuery({
  ...queryOptions,
  refetchOnWindowFocus: true,  // 窗口聚焦时刷新 (默认)
});
```

---

## 变更操作

### Default Options 集中管理

使用 `experimental_defaults` 集中管理默认的行为（Toast 提示、错误处理等）：

```typescript
export const orpc = createTanstackQueryUtils(client, {
  experimental_defaults: {
    organization: {
      inviteMember: {
        mutationOptions: {
          onSuccess: () => {
            // Toast 提示已在 experimental_defaults 中统一配置
            queryClient.invalidateQueries({
              queryKey: orpc.organization.listInvitations.key(),
            });
          },
        },
      },
      // ... 其他 mutations
    },
  },
});
```

**注意**: `experimental_defaults` 是实验性 API。详细的 Toast 模式说明 → [ui-patterns.md](./ui-patterns.md#toast-通知模式)

### 创建数据

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function CreateTeamForm() {
  const queryClient = useQueryClient();

  // ✅ 简化后 - 只需要组件特定的逻辑
  const createMutation = useMutation(
    orpc.organization.createTeam.mutationOptions({
      onSuccess: () => {
        setIsOpen(false);
        queryClient.invalidateQueries({
          queryKey: orpc.organization.listTeams.key(),
        });
      },
    })
  );

  const handleSubmit = (data: { name: string }) => {
    const orgId = session?.user?.activeOrganizationId || "";
    createMutation.mutate({
      organizationId: orgId,
      ...data,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单字段 */}
    </form>
  );
}
```

### 更新数据

**何时使用**: 需要立即反馈用户体验的场景
**何时不使用**: 数据一致性要求高、操作复杂

```typescript
const updateMutation = useMutation({
  mutationFn: orpc.organization.updateTeam.mutate,
  onMutate: async (variables) => {
    // 乐观更新
    await queryClient.cancelQueries({
      queryKey: orpc.organization.listTeams.key(),
    });

    const previousTeams = queryClient.getQueryData(
      orpc.organization.listTeams.key()
    );

    // 更新缓存
    queryClient.setQueryData(
      orpc.organization.listTeams.key(),
      (old: Team[] | undefined) =>
        old?.map((team) =>
          team.id === variables.teamId
            ? { ...team, ...variables }
            : team
        )
    );

    return { previousTeams };
  },
  onError: (error, variables, context) => {
    // 回滚
    if (context?.previousTeams) {
      queryClient.setQueryData(
        orpc.organization.listTeams.key(),
        context.previousTeams
      );
    }
    toast.error(`Failed: ${error.message}`);
  },
  onSuccess: () => {
    toast.success("Updated successfully");
  },
  onSettled: () => {
    // 无论成功失败都刷新
    queryClient.invalidateQueries({
      queryKey: orpc.organization.listTeams.key(),
    });
  },
});
```

### 删除数据

```typescript
const deleteMutation = useMutation(
  orpc.organization.removeTeam.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orpc.organization.listTeams.key(),
      });
    },
  })
);

const handleDelete = (teamId: string) => {
  if (confirm("Are you sure?")) {
    deleteMutation.mutate({
      teamId,
      organizationId: orgId,
    });
  }
};
```

**注意**: `experimental_defaults` 是实验性 API，可能在未来版本中变化。

---

## 数据缓存策略

### 缓存配置

```typescript
const { data } = useQuery({
  ...queryOptions,
  staleTime: 5 * 60 * 1000,      // 5 分钟内认为数据是新的
  gcTime: 10 * 60 * 1000,        // 10 分钟后垃圾回收 (默认)
});
```

### 缓存失效

```typescript
// 失效单个查询 - 使用 .key() 方法
queryClient.invalidateQueries({
  queryKey: orpc.organization.listTeams.key(),
});

// 失效多个查询 - 匹配前缀
queryClient.invalidateQueries({
  queryKey: orpc.organization.listTeams.key().slice(0, 1),
});

// 失效所有查询
queryClient.invalidateQueries();
```

### 关键 Helper 方法

| 方法 | 用途 | 示例 |
|------|------|------|
| `.key()` | 部分匹配，用于失效查询 | `orpc.organization.listMembers.key()` |
| `.queryKey()` | 完整匹配，用于特定查询 | `orpc.organization.find.queryKey({ input: { id: 1 } })` |
| `.mutationOptions()` | 获取 mutation 配置 | `orpc.organization.create.mutationOptions()` |

### 设置查询数据

```typescript
// 直接设置数据
queryClient.setQueryData(
  orpc.organization.listTeams.key(),
  newTeams
);

// 使用函数更新
queryClient.setQueryData(
  orpc.organization.listTeams.key(),
  (oldTeams) => [
    ...oldTeams,
    newTeam,
  ]
);
```

---

## 分页和无限滚动

### 分页查询

```typescript
const getTeamsOptions = (orgId: string, page: number, limit: number) =>
  orpc.organization.listTeams.queryOptions({
    organizationId: orgId,
    offset: (page - 1) * limit,
    limit,
  });

function TeamsList() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery(getTeamsOptions(orgId, page, limit));

  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <div>
      {/* 数据列表 */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
```

### 无限滚动

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";

const getTeamsInfiniteOptions = (orgId: string) =>
  orpc.organization.listTeams.queryOptions({
    organizationId: orgId,
    limit: 20,
  });

function TeamsInfiniteList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...getTeamsInfiniteOptions(orgId),
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  return (
    <div>
      {data?.pages.map((page) =>
        page.items.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))
      )}

      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </Button>
      )}
    </div>
  );
}
```

---

## Session 获取

### 使用 authClient Hook

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

```typescript
import { orpc } from "@/utils/orpc";

function MyComponent() {
  const { data: session } = useQuery(
    orpc.privateData.queryOptions()
  );

  if (!session) return <div>Not authenticated</div>;

  return <div>Welcome {session.user.name}</div>;
}
```

---

## 相关文档

- **路由系统详解**: [docs/routing.md](./routing.md)
- **认证流程详解**: [docs/authentication.md](./authentication.md)
- **CRUD 模式**: [docs/crud-patterns.md](./crud-patterns.md)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [@orpc/tanstack-query 文档](https://orpc.unnoq.com/docs/integrations/tanstack-query)
