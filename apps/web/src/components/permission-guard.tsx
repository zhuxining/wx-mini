import { useSuspenseQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

interface PermissionGuardProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	role?: "owner" | "admin" | "member";
}

/**
 * UI 层权限守卫组件
 * 根据用户角色控制子元素显示
 */
export function PermissionGuard({
	children,
	fallback = null,
	role,
}: PermissionGuardProps) {
	const { data: session } = useSuspenseQuery(orpc.privateData.queryOptions());

	if (!session?.user) {
		return <>{fallback}</>;
	}

	if (role) {
		// 使用 authClient 获取当前成员信息
		const { data: member } = useSuspenseQuery({
			queryKey: ["organization", "activeMember"],
			queryFn: () => authClient.organization.getActiveMember(),
		});
		const hasRole = checkRole((member as { role?: string } | null)?.role, role);
		return hasRole ? children : fallback;
	}

	return <>{children}</>;
}

/**
 * 角色层级检查
 * Owner > Admin > Member
 */
function checkRole(
	userRole: string | undefined,
	requiredRole: "owner" | "admin" | "member",
): boolean {
	if (!userRole) return false;
	const hierarchy = ["owner", "admin", "member"];
	const userIndex = hierarchy.indexOf(userRole);
	const requiredIndex = hierarchy.indexOf(requiredRole);
	return userIndex <= requiredIndex && userIndex !== -1;
}
