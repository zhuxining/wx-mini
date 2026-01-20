import { auth } from "@org-sass/auth";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "../index";

type OrgRole = "member" | "admin" | "owner";

export const organizationRouter = {
	createOrganization: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				slug: z.string(),
				logo: z.string().optional(),
				metadata: z.record(z.string(), z.unknown()).optional(),
				userId: z.string().optional(),
				keepCurrentActiveOrganization: z.boolean().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.createOrganization({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to create organization",
				});
			}
		}),

	listOrganizations: protectedProcedure.handler(async ({ context }) => {
		try {
			const result = await auth.api.listOrganizations({
				headers: context.req.headers,
			});
			return result;
		} catch (error) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message:
					error instanceof Error
						? error.message
						: "Failed to list organizations",
			});
		}
	}),

	getFullOrganization: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().optional(),
				organizationSlug: z.string().optional(),
				membersLimit: z.number().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.getFullOrganization({
					query: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to get organization",
				});
			}
		}),

	updateOrganization: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().optional(),
				data: z.record(z.string(), z.unknown()),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.updateOrganization({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to update organization",
				});
			}
		}),

	deleteOrganization: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.deleteOrganization({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to delete organization",
				});
			}
		}),

	setActiveOrganization: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().nullable().optional(),
				organizationSlug: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.setActiveOrganization({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to set active organization",
				});
			}
		}),

	addMember: protectedProcedure
		.input(
			z.object({
				userId: z.string(),
				role: z.enum(["member", "admin", "owner"]),
				organizationId: z.string().optional(),
				teamId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.addMember({
					body: {
						userId: input.userId,
						role: input.role as OrgRole,
						organizationId: input.organizationId,
						teamId: input.teamId,
					},
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to add member",
				});
			}
		}),

	removeMember: protectedProcedure
		.input(
			z.object({
				memberIdOrEmail: z.string(),
				organizationId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.removeMember({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to remove member",
				});
			}
		}),

	listMembers: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().optional(),
				organizationSlug: z.string().optional(),
				limit: z.union([z.string(), z.number()]).optional(),
				offset: z.union([z.string(), z.number()]).optional(),
				sortBy: z.string().optional(),
				sortDirection: z.enum(["asc", "desc"]).optional(),
				filterField: z.string().optional(),
				filterValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
				filterOperator: z
					.enum(["eq", "ne", "lt", "lte", "gt", "gte", "contains"])
					.optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.listMembers({
					query: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to list members",
				});
			}
		}),

	updateMemberRole: protectedProcedure
		.input(
			z.object({
				memberId: z.string(),
				role: z.enum(["member", "admin", "owner"]),
				organizationId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.updateMemberRole({
					body: {
						memberId: input.memberId,
						role: input.role as OrgRole,
						organizationId: input.organizationId,
					},
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to update member role",
				});
			}
		}),

	getActiveMember: protectedProcedure.handler(async ({ context }) => {
		try {
			const result = await auth.api.getActiveMember({
				headers: context.req.headers,
			});
			return result;
		} catch (error) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message:
					error instanceof Error
						? error.message
						: "Failed to get active member",
			});
		}
	}),

	leaveOrganization: protectedProcedure
		.input(
			z.object({
				organizationId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.leaveOrganization({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to leave organization",
				});
			}
		}),

	inviteMember: protectedProcedure
		.input(
			z.object({
				email: z.email(),
				role: z.enum(["member", "admin", "owner"]),
				organizationId: z.string().optional(),
				resend: z.boolean().optional(),
				teamId: z.union([z.string(), z.array(z.string())]).optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.createInvitation({
					body: {
						email: input.email,
						role: input.role as OrgRole,
						organizationId: input.organizationId,
						resend: input.resend,
						teamId: input.teamId,
					},
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to invite member",
				});
			}
		}),

	acceptInvitation: protectedProcedure
		.input(
			z.object({
				invitationId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.acceptInvitation({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to accept invitation",
				});
			}
		}),

	rejectInvitation: protectedProcedure
		.input(
			z.object({
				invitationId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.rejectInvitation({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to reject invitation",
				});
			}
		}),

	cancelInvitation: protectedProcedure
		.input(
			z.object({
				invitationId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.cancelInvitation({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to cancel invitation",
				});
			}
		}),

	getInvitation: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.getInvitation({
					query: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to get invitation",
				});
			}
		}),

	listInvitations: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.listInvitations({
					query: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to list invitations",
				});
			}
		}),

	createTeam: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				organizationId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.createTeam({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to create team",
				});
			}
		}),

	updateTeam: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
				data: z.record(z.string(), z.unknown()),
				organizationId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.updateTeam({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to update team",
				});
			}
		}),

	removeTeam: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
				organizationId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.removeTeam({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to remove team",
				});
			}
		}),

	listTeams: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.listOrganizationTeams({
					query: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error ? error.message : "Failed to list teams",
				});
			}
		}),

	addTeamMember: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
				userId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.addTeamMember({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to add team member",
				});
			}
		}),

	removeTeamMember: protectedProcedure
		.input(
			z.object({
				teamId: z.string(),
				userId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.removeTeamMember({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to remove team member",
				});
			}
		}),

	setActiveTeam: protectedProcedure
		.input(
			z.object({
				teamId: z.string().nullable().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.setActiveTeam({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to set active team",
				});
			}
		}),

	listUserTeams: protectedProcedure.handler(async ({ context }) => {
		try {
			const result = await auth.api.listUserTeams({
				headers: context.req.headers,
			});
			return result;
		} catch (error) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message:
					error instanceof Error ? error.message : "Failed to list user teams",
			});
		}
	}),

	listTeamMembers: protectedProcedure
		.input(
			z.object({
				teamId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.listTeamMembers({
					query: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to list team members",
				});
			}
		}),

	hasPermission: protectedProcedure
		.input(
			z.object({
				organizationId: z.string().optional(),
				permissions: z.object({
					organization: z.array(z.enum(["update", "delete"])).optional(),
					member: z.array(z.enum(["create", "update", "delete"])).optional(),
					invitation: z.array(z.enum(["create", "cancel"])).optional(),
					team: z.array(z.enum(["create", "update", "delete"])).optional(),
					ac: z
						.array(z.enum(["create", "update", "delete", "read"]))
						.optional(),
				}),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.hasPermission({
					body: {
						organizationId: input.organizationId,
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

	checkOrganizationSlug: protectedProcedure
		.input(
			z.object({
				slug: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			try {
				const result = await auth.api.checkOrganizationSlug({
					body: input,
					headers: context.req.headers,
				});
				return result;
			} catch (error) {
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message:
						error instanceof Error
							? error.message
							: "Failed to check organization slug",
				});
			}
		}),
};
