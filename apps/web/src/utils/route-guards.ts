import type { Context } from "@org-sass/api/context";
import { redirect } from "@tanstack/react-router";
import { getSession } from "@/functions/get-session";
import type { RouterAppContext } from "@/routes/__root";

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
export async function requireSession(_ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ message: string; user: SessionUser }> {
	// 使用 getSession 服务器函数获取 session
	const session = await getSession();

	if (!session?.user) {
		throw redirect({
			to: "/login",
			search: { redirect: location.href },
		});
	}

	return {
		message: "This is private",
		user: session.user as SessionUser,
	};
}

/**
 * 要求用户是系统管理员
 * @returns 用户的 session 数据
 * @throws 重定向到登录页（如果不是管理员）
 */
export async function requireAdmin(ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{ message: string; user: SessionUser }> {
	const session = await requireSession(ctx);

	const role = session.user.role;
	if (!role || role !== "admin") throw redirect({ to: "/login" });

	return session;
}
