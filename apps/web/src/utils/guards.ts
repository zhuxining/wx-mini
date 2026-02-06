import type { auth } from "@org-sass/auth";
import { getSession } from "@/functions/get-session";
import type { RouterAppContext } from "@/routes/__root";
import { UnauthorizedError } from "@/utils/errors";

// 从 Better-Auth 获取 Session 类型
type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * 要求用户已登录
 * @returns 用户的 session 数据
 * @throws UnauthorizedError 如果未登录
 */
export async function requireSession(_ctx: {
	context: RouterAppContext;
	location?: { href: string };
}): Promise<{
	message: string;
	user: NonNullable<NonNullable<Session>["user"]>;
}> {
	// 使用 getSession 服务器函数获取 session
	const session = await getSession();

	if (!session?.user) {
		// 抛出 401 错误，由 fallback 系统处理显示 UnauthorizedPage
		throw new UnauthorizedError("您需要登录才能访问此页面");
	}

	return {
		message: "This is private",
		user: session.user,
	};
}
