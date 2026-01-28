import type { Context } from "@org-sass/api/context";
import { redirect } from "@tanstack/react-router";
import type { RouterAppContext } from "@/routes/__root";
import { orpc, queryClient } from "./orpc";

// Session 用户类型（包含 Better-Auth 组织插件字段）
type SessionUser = NonNullable<Context["session"]>["user"] & {
	activeOrganizationId?: string | null;
	activeTeamId?: string | null;
};

/**
 * 要求用户已登录
 * @returns 用户的 session 数据
 * @throws 重定向到登录页（如果未登录）
 */
export async function requireSession(ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ message: string; user: SessionUser }> {
	// ✅ 从 router context 直接读取,SSR 和客户端都可靠
	const session = ctx.context.session;

	if (!session?.user) {
		throw redirect({
			to: "/login",
			search: {
				redirect: ctx.location?.href || "/",
			} as const,
		});
	}

	return {
		message: "This is private",
		user: session.user as SessionUser,
	};
}

/**
 * 要求用户有活跃组织
 * @returns 用户的 session 数据
 * @throws 重定向到首页（如果没有活跃组织）
 */
export async function requireActiveOrg(ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ message: string; user: SessionUser }> {
	const session = await requireSession(ctx);

	if (!session.user.activeOrganizationId) {
		throw redirect({ to: "/" });
	}

	return session;
}

/**
 * 要求用户是系统管理员
 * @returns 用户的 session 数据
 * @throws 重定向到组织仪表盘（如果不是管理员）
 */
export async function requireAdmin(ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ message: string; user: SessionUser }> {
	const session = await requireSession(ctx);

	const role = session.user.role;
	if (
		!role ||
		(Array.isArray(role) && !role.includes("admin")) ||
		(typeof role === "string" && role !== "admin")
	) {
		throw redirect({ to: "/org/dashboard" });
	}

	return session;
}

/**
 * 要求组织成员（至少是 Member）
 * @returns 用户的 session 数据
 */
export const requireOrgMember = requireActiveOrg;

/**
 * 要求 Moderator 或 Owner
 * @returns 用户的 session 数据
 * @throws 重定向到组织仪表盘（如果是 Member）
 */
export async function requireModerator(ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ message: string; user: SessionUser }> {
	const session = await requireActiveOrg(ctx);
	const member = await getActiveMember();

	if (member?.role === "member") {
		throw redirect({ to: "/org/dashboard" });
	}

	return session;
}

/**
 * 要求 Owner
 * @returns 用户的 session 数据
 * @throws 重定向到组织仪表盘（如果不是 Owner）
 */
export async function requireOwner(ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ message: string; user: SessionUser }> {
	const session = await requireActiveOrg(ctx);
	const member = await getActiveMember();

	if (member?.role !== "owner") {
		throw redirect({ to: "/org/dashboard" });
	}

	return session;
}

/**
 * 辅助函数：获取活跃成员
 * 使用 queryClient 确保数据可用
 */
async function getActiveMember() {
	return await queryClient.ensureQueryData(
		orpc.organization.getActiveMember.queryOptions(),
	);
}
