import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/functions/get-session";

export const Route = createFileRoute("/(example)/posts")({
	ssr: "data-only",
	component: PostsLayout,
	beforeLoad: async () => {
		const session = await getSession();
		return { session };
	},
	loader: async ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/login" });
		}
	},
});

function PostsLayout() {
	return <Outlet />;
}
