import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { orpc } from "@/utils/orpc";
import { requireAdmin } from "@/utils/route-guards";

export const Route = createFileRoute("/admin/dashboard/")({
	beforeLoad: requireAdmin,
	loader: async ({ context }) => {
		// 并行预取数据
		await Promise.all([
			context.queryClient.ensureQueryData(
				orpc.organization.listOrganizations.queryOptions(),
			),
			context.queryClient.ensureQueryData(orpc.admin.listUsers.queryOptions()),
		]);
	},
	component: AdminDashboard,
});

function AdminDashboard() {
	// 数据已在 loader 中预取，无加载状态
	const { data: orgs } = useSuspenseQuery(
		orpc.organization.listOrganizations.queryOptions(),
	);
	const { data: users } = useSuspenseQuery(orpc.admin.listUsers.queryOptions());

	const orgCount = orgs?.length ?? 0;
	const userCount = users?.length ?? 0;
	const sessionCount = 0;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12" />
			<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
				<div className="grid auto-rows-min gap-4 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>Organizations</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-4xl">{orgCount}</div>
							<CardDescription>Total organizations in system</CardDescription>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Users</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-4xl">{userCount}</div>
							<CardDescription>Total users in system</CardDescription>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Active Sessions</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-4xl">{sessionCount}</div>
							<CardDescription>Currently active sessions</CardDescription>
						</CardContent>
					</Card>
				</div>
				<div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
			</div>
		</>
	);
}
