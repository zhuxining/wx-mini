import type { Context } from "@org-sass/api/context";
import { auth } from "@org-sass/auth";
import { redirect } from "@tanstack/react-router";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { getSession } from "@/functions/get-session";
import type { RouterAppContext } from "@/routes/__root";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";

// Session 用户类型（包含 Better-Auth 组织插件字段）
type SessionUser = NonNullable<Context["session"]>["user"] & {
	activeOrganizationId?: string | null;
	activeTeamId?: string | null;
};

/**
 * 要求用户已登录
 * @returns 用户的 session 数据
 * @throws UnauthorizedError 如果未登录
 */
export async function requireSession(_ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ message: string; user: SessionUser }> {
	// 使用 getSession 服务器函数获取 session
	const session = await getSession();

	if (!session?.user) {
		// 抛出 401 错误，由 fallback 系统处理显示 UnauthorizedPage
		throw new UnauthorizedError("您需要登录才能访问此页面");
	}

	return {
		message: "This is private",
		user: session.user as SessionUser,
	};
}

/**
 * 要求用户有活跃的组织
 * @returns 用户信息和活跃组织 ID
 * @throws UnauthorizedError 如果未登录
 * @throws redirect 到组织选择页面（如果无活跃组织）
 */
export async function requireActiveOrganization(_ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ user: SessionUser; activeOrganizationId: string }> {
	// 先检查登录状态
	const session = await getSession();

	if (!session?.user) {
		throw new UnauthorizedError("您需要登录才能访问此页面");
	}

	const activeOrganizationId = (session.user as SessionUser)
		.activeOrganizationId;

	if (!activeOrganizationId) {
		// 业务流程：无组织时导航到组织选择页面
		throw redirect({
			to: "/org",
		});
	}

	return {
		user: session.user as SessionUser,
		activeOrganizationId,
	};
}

/**
 * 要求用户在组织中的角色符合要求
 * @throws UnauthorizedError 如果未登录
 * @throws ForbiddenError 如果权限不足
 */
export async function requireRole(options: {
	context: RouterAppContext;
	location?: { href: string };
	role: "owner" | "admin" | "member";
	minimumRole?: boolean;
}): Promise<{ user: SessionUser; member: { role: string } }> {
	const { user } = await requireActiveOrganization(options);

	// 使用 Better-Auth 服务端 API 获取组织成员信息
	const member = await auth.api.getActiveMember({
		headers: (await getRequestHeaders()) as Headers,
	});

	if (!member) {
		throw new UnauthorizedError("无法获取组织成员信息");
	}

	const checkRole = options.minimumRole
		? getRoleWeight(member.role) >= getRoleWeight(options.role)
		: member.role === options.role;

	if (!checkRole) {
		// 抛出 403 错误，由 fallback 系统处理显示 ForbiddenPage
		throw new ForbiddenError("您没有权限访问此资源", {
			requiredRole: options.role,
		});
	}

	return { user, member };
}

/**
 * 获取角色权重（用于比较角色等级）
 */
function getRoleWeight(role: string): number {
	const weights = { owner: 3, admin: 2, member: 1 };
	return weights[role as keyof typeof weights] ?? 0;
}

/**
 * 快捷方法：要求 admin 或以上角色
 */
export const requireAdmin = (ctx: Parameters<typeof requireRole>[0]) =>
	requireRole({ ...ctx, role: "admin" });

/**
 * 快捷方法：要求 owner 角色
 */
export const requireOwner = (ctx: Parameters<typeof requireRole>[0]) =>
	requireRole({ ...ctx, role: "owner" });
