import { ORPCError, os } from "@orpc/server";

import type { Context } from "./context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);

export function requireAdmin(context: Context) {
	const role = context.session?.user?.role;
	if (!role || !role.includes("admin")) {
		throw new ORPCError("FORBIDDEN", {
			message: "Admin access required",
		});
	}
}
