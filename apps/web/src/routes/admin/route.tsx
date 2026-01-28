import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAdmin } from "@/utils/route-guards";
import { AppSidebar } from "./-components/app-sidebar";

export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ context, location }) => {
		await requireAdmin({ context, location });
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
