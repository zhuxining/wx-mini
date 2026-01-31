import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAdmin } from "@/utils/guards";

export const Route = createFileRoute("/org/teams")({
	beforeLoad: async ({ context, location }) => {
		// 需要 admin 或更高角色
		await requireAdmin({ context, location });
	},
	component: TeamsLayout,
});

function TeamsLayout() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<Outlet />
		</div>
	);
}
