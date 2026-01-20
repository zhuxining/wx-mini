import { auth } from "@org-sass/auth";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure, requireAdmin } from "../index";

// Role types for Better-Auth Admin plugin
type AdminRole = "user" | "admin";

export const adminRouter = {
	createUser: protectedProcedure
		.input(
			z.object({
				email: z.email(),
				password: z.string().min(1),
				name: z.string(),
				role: z.enum(["user", "admin"]).optional(),
				data: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.createUser({
					body: {
						...input,
						role: input.role as AdminRole | undefined,
					},
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to create user",
				});
			}
		}),

	listUsers: protectedProcedure
		.input(
			z.object({
				searchValue: z.string().optional(),
				searchField: z.enum(["email", "name"]).optional(),
				searchOperator: z
					.enum(["contains", "starts_with", "ends_with"])
					.optional(),
				limit: z.union([z.string(), z.number()]).optional(),
				offset: z.union([z.string(), z.number()]).optional(),
				sortBy: z.string().optional(),
				sortDirection: z.enum(["asc", "desc"]).optional(),
				filterField: z.string().optional(),
				filterValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
				filterOperator: z
					.enum(["eq", "ne", "lt", "lte", "gt", "gte"])
					.optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.listUsers({
					query: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to list users",
				});
			}
		}),

	updateUser: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				data: z.record(z.string(), z.unknown()),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.adminUpdateUser({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to update user",
				});
			}
		}),

	removeUser: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.removeUser({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to remove user",
				});
			}
		}),

	setUserPassword: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				newPassword: z.string().min(1),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.setUserPassword({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to set user password",
				});
			}
		}),

	setRole: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				role: z.union([
					z.enum(["user", "admin"]),
					z.array(z.enum(["user", "admin"])),
				]),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.setRole({
					body: {
						userId: input.userId,
						role: input.role as AdminRole | AdminRole[],
					},
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to set role",
				});
			}
		}),

	banUser: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				banReason: z.string().optional(),
				banExpiresIn: z.number().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.banUser({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to ban user",
				});
			}
		}),

	unbanUser: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.unbanUser({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to unban user",
				});
			}
		}),

	listUserSessions: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.listUserSessions({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to list user sessions",
				});
			}
		}),

	revokeUserSession: protectedProcedure
		.input(
			z.object({
				sessionToken: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.revokeUserSession({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to revoke user session",
				});
			}
		}),

	revokeUserSessions: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.revokeUserSessions({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to revoke user sessions",
				});
			}
		}),

	impersonateUser: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.impersonateUser({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to impersonate user",
				});
			}
		}),

	stopImpersonating: protectedProcedure.handler(async ({ context }) => {
		requireAdmin(context);
		try {
			const result = await auth.api.stopImpersonating({
				headers: context.req.headers,
			});
			return result;
		} catch (error) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message:
					error instanceof Error
						? error.message
						: "Failed to stop impersonating",
			});
		}
	}),

	hasPermission: protectedProcedure
		.input(
			z.object({
				userId: z.string().optional(),
				role: z.enum(["user", "admin"]).optional(),
				permissions: z.object({
					user: z
						.array(
							z.enum([
								"set-role",
								"create",
								"update",
								"delete",
								"list",
								"ban",
								"impersonate",
								"set-password",
								"get",
							]),
						)
						.optional(),
					session: z.array(z.enum(["delete", "list", "revoke"])).optional(),
				}),
			}),
		)
		.handler(async ({ input, context }) => {
			requireAdmin(context);
			try {
				const result = await auth.api.userHasPermission({
					body: {
						userId: input.userId,
						role: input.role as AdminRole | undefined,
						permissions: input.permissions,
					},
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to check permission",
				});
			}
		}),
};
