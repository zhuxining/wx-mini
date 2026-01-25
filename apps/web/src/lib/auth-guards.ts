import { redirect } from "@tanstack/react-router";

export type RouteContext = {
	session?: {
		user?: {
			id: string;
			email: string;
			name: string;
			role?: string | string[];
			image?: string;
		};
	};
};

export function requireAdminRole(context: RouteContext): void {
	const session = context.session;
	if (!session?.user) {
		throw redirect({
			to: "/login",
			search: { redirect: location.href },
		});
	}

	const role = session.user.role;
	if (
		!role ||
		(Array.isArray(role) && !role.includes("admin")) ||
		(typeof role === "string" && role !== "admin")
	) {
		throw redirect({ to: "/org" });
	}
}

export function requireAuth(context: RouteContext): void {
	if (!context.session?.user) {
		throw redirect({
			to: "/login",
			search: { redirect: location.href },
		});
	}
}
