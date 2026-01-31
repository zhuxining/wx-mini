import { redirect } from "@tanstack/react-router";
import type { RouterAppContext } from "@/routes/__root";
import { orpc } from "./orpc";
import { requireSession } from "./route-guards";

type BeforeLoadContext = {
	context: RouterAppContext;
};

/**
 * Require owner role for route access
 */
export async function requireOwner(
	ctx: BeforeLoadContext,
	redirectTo = "/org/dashboard",
): Promise<void> {
	const session = await requireSession(ctx);
	const organizationId = session.user.activeOrganizationId;

	if (!organizationId) {
		throw redirect({ to: "/" });
	}

	// Check if user is owner
	const memberData = await ctx.context.queryClient.ensureQueryData(
		orpc.organization.getActiveMember.queryOptions(),
	);

	if (memberData?.role !== "owner") {
		throw redirect({ to: redirectTo });
	}
}

/**
 * Require admin or higher role (Owner/Admin)
 */
export async function requireAdmin(
	ctx: BeforeLoadContext,
	redirectTo = "/org/dashboard",
): Promise<void> {
	const session = await requireSession(ctx);
	const organizationId = session.user.activeOrganizationId;

	if (!organizationId) {
		throw redirect({ to: "/" });
	}

	const memberData = await ctx.context.queryClient.ensureQueryData(
		orpc.organization.getActiveMember.queryOptions(),
	);

	if (memberData?.role !== "owner" && memberData?.role !== "admin") {
		throw redirect({ to: redirectTo });
	}
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(
	ctx: BeforeLoadContext,
	roles: Array<"owner" | "admin" | "member">,
	redirectTo = "/org/dashboard",
): Promise<void> {
	const session = await requireSession(ctx);
	const organizationId = session.user.activeOrganizationId;

	if (!organizationId) {
		throw redirect({ to: "/" });
	}

	const memberData = await ctx.context.queryClient.ensureQueryData(
		orpc.organization.getActiveMember.queryOptions(),
	);

	if (!memberData?.role || !roles.includes(memberData.role)) {
		throw redirect({ to: redirectTo });
	}
}
