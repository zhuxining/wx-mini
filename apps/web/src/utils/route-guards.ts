import { redirect } from "@tanstack/react-router";
import type { RouterAppContext } from "@/routes/__root";
import { orpc } from "./orpc";

/**
 * 路由守卫上下文 - TanStack Router beforeLoad/loader 的 context
 */
export type RouteGuardContext = Pick<RouterAppContext, "orpc" | "queryClient">;

/**
 * 要求用户已登录
 * @returns 用户的 session 数据
 * @throws 重定向到登录页（如果未登录）
 */
export async function requireSession(
	context: RouteGuardContext,
): Promise<
	NonNullable<Awaited<ReturnType<typeof orpc.privateData.queryOptions>>>["data"]
> {
	const result = await context.queryClient.ensureQueryData(
		orpc.privateData.queryOptions(),
	);

	if (!result?.user) {
		throw redirect({
			to: "/sign-in",
			search: {
				redirect: location.href,
			},
		});
	}

	return result;
}

/**
 * 要求用户有活跃组织
 * @returns 用户的 session 数据
 * @throws 重定向到创建组织页（如果没有活跃组织）
 */
export async function requireActiveOrg(
	context: RouteGuardContext,
): Promise<
	NonNullable<Awaited<ReturnType<typeof orpc.privateData.queryOptions>>>["data"]
> {
	const session = await requireSession(context);

	if (!session.user.activeOrganizationId) {
		throw redirect({
			to: "/org/create",
		});
	}

	return session;
}

/**
 * 要求用户是管理员
 * @returns 用户的 session 数据
 * @throws 重定向到组织仪表盘（如果不是管理员）
 */
export async function requireAdmin(
	context: RouteGuardContext,
): Promise<
	NonNullable<Awaited<ReturnType<typeof orpc.privateData.queryOptions>>>["data"]
> {
	const session = await requireSession(context);

	const role = session.user.role;
	if (
		!role ||
		(Array.isArray(role) && !role.includes("admin")) ||
		(typeof role === "string" && role !== "admin")
	) {
		throw redirect({
			to: "/org/dashboard",
		});
	}

	return session;
}
