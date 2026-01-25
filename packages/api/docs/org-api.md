# Organization API 端点目录

**文件**: `packages/api/src/routers/organization.ts`

**总数**: 28 个端点

---

## 组织管理 (6 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `createOrganization` | 创建组织 | 认证用户 |
| `listOrganizations` | 列出用户所属组织 | 认证用户 |
| `getFullOrganization` | 获取完整组织信息 | 组织成员 |
| `updateOrganization` | 更新组织信息 | 组织管理员 |
| `deleteOrganization` | 删除组织 | 组织所有者 |
| `setActiveOrganization` | 设置活动组织 | 组织成员 |

---

## 成员管理 (5 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `addMember` | 添加成员 | 组织管理员 |
| `removeMember` | 移除成员 | 组织管理员 |
| `listMembers` | 列出成员 | 组织成员 |
| `updateMemberRole` | 更新成员角色 | 组织管理员 |
| `getActiveMember` | 获取当前成员信息 | 认证用户 |

---

## 邀请管理 (6 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `inviteMember` | 邀请成员 | 组织管理员 |
| `acceptInvitation` | 接受邀请 | 认证用户 |
| `rejectInvitation` | 拒绝邀请 | 认证用户 |
| `cancelInvitation` | 取消邀请 | 组织管理员 |
| `getInvitation` | 获取邀请详情 | 公开（需验证 token） |
| `listInvitations` | 列出邀请 | 组织管理员 |

---

## 团队管理 (6 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `createTeam` | 创建团队 | 组织成员 |
| `updateTeam` | 更新团队 | 组织成员 |
| `removeTeam` | 删除团队 | 组织成员 |
| `listTeams` | 列出团队 | 组织成员 |
| `addTeamMember` | 添加团队成员 | 组织成员 |
| `removeTeamMember` | 移除团队成员 | 组织成员 |

---

## 角色权限 (5 个)

| 端点 | 功能 | 权限 |
|------|------|------|
| `createRole` | 创建自定义角色 | 组织管理员 |
| `updateRole` | 更新角色 | 组织管理员 |
| `deleteRole` | 删除角色 | 组织管理员 |
| `listRoles` | 列出角色 | 组织成员 |
| `hasPermission` | 检查权限 | 组织成员 |

---

## 调用示例

```typescript
import { orpc } from "@/utils/orpc";

// 获取活动组织 ID
const orgId = session?.user?.activeOrganizationId || "";

// 列出团队成员
const { data } = await orpc.organization.listTeams({ organizationId: orgId });

// 创建团队
const mutation = useMutation({
  mutationFn: orpc.organization.createTeam.mutate,
  onSuccess: () => {
    toast.success("Team created");
    queryClient.invalidateQueries({
      queryKey: orpc.organization.listTeams.key()
    });
  },
});

mutation.mutate({ organizationId: orgId, name: "Engineering" });
```
