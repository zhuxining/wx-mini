import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./-components/app-sidebar";

export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ context, location }) => {
		const { session } = context;

		// ✅ 检查是否登录
		if (!session?.user) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		// ✅ 检查是否为系统管理员
		const isAdmin =
			session.user.role === "admin" ||
			(Array.isArray(session.user.role) && session.user.role.includes("admin"));

		if (!isAdmin) {
			throw redirect({ to: "/org/dashboard" });
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<Outlet />
			</SidebarInset>
		</SidebarProvider>
	);
}
