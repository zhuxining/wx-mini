import type { Context } from "@org-sass/api/context";
import type { RouterAppContext } from "@/routes/__root";

/**
 * 扩展 Session 用户类型，包含 Better-Auth 组织插件字段
 */
export type SessionUser = NonNullable<Context["session"]>["user"] & {
	activeOrganizationId?: string | null;
	activeTeamId?: string | null;
};

/**
 * 守卫上下文
 */
export interface GuardContext {
	context: RouterAppContext;
	location?: { href: string };
}

/**
 * BeforeLoad 上下文（简化版，用于权限守卫）
 */
export type BeforeLoadContext = GuardContext;

/**
 * 守卫结果
 */
export interface GuardResult {
	user: SessionUser;
	memberId?: string;
	organizationId?: string;
}

/**
 * 组织内置角色（Better-Auth 默认角色）
 */
export type OrgBuiltInRole = "owner" | "admin" | "member";

/**
 * 组织角色
 */
export type OrgRole = OrgBuiltInRole | string;

/**
 * 角色层级定义
 * owner > admin > member
 */
export const ROLE_HIERARCHY: Record<OrgBuiltInRole, number> = {
	owner: 3,
	admin: 2,
	member: 1,
} as const;
