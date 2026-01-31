import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/org/members/$memberId")({
	beforeLoad: async ({ context }) => {
		// 需要 admin 或更高角色
		const { requireAdmin } = await import("@/utils/permission-guards");
		await requireAdmin({ context });
	},
	component: MemberDetailLayout,
});

function MemberDetailLayout() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<Outlet />
		</div>
	);
}
