import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./-components/app-sidebar";

export const Route = createFileRoute("/org")({
	beforeLoad: async ({ context, location }) => {
		const { session } = context;

		// ✅ 检查是否登录
		if (!session?.user) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		// ✅ 检查是否有活跃组织
		// @ts-expect-error - Better-Auth 的 session.user 类型可能没有 activeOrganizationId
		if (!session.user.activeOrganizationId) {
			throw redirect({ to: "/" });
		}
	},
	component: OrgLayout,
});

function OrgLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
