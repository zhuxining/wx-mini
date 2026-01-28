import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

interface PermissionGuardProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	role?: "owner" | "moderator" | "member";
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
		const { data: member } = useSuspenseQuery(
			orpc.organization.getActiveMember.queryOptions(),
		);
		const hasRole = checkRole(member?.role, role);
		return hasRole ? children : fallback;
	}

	return <>{children}</>;
}

/**
 * 角色层级检查
 * Owner > Moderator > Member
 */
function checkRole(
	userRole: string | undefined,
	requiredRole: "owner" | "moderator" | "member",
): boolean {
	if (!userRole) return false;
	const hierarchy = ["owner", "moderator", "member"];
	const userIndex = hierarchy.indexOf(userRole);
	const requiredIndex = hierarchy.indexOf(requiredRole);
	return userIndex <= requiredIndex && userIndex !== -1;
}
