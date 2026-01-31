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

export const Route = createFileRoute("/org/dashboard/")({
	// ✅ 继承父路由 /org 的 beforeLoad,无需重复检查
	loader: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(
			orpc.privateData.queryOptions(),
		);

		const organizationId = (
			session.user as {
				activeOrganizationId?: string | null;
			}
		).activeOrganizationId;
		if (!organizationId) return;

		// 并行预取所有数据
		await Promise.all([
			context.queryClient.ensureQueryData(
				orpc.organization.getFullOrganization.queryOptions({
					input: { organizationId },
				}),
			),
			context.queryClient.ensureQueryData(
				orpc.organization.listMembers.queryOptions({ input: {} }),
			),
			context.queryClient.ensureQueryData(
				orpc.organization.listInvitations.queryOptions({ input: {} }),
			),
		]);
	},
	component: OrgDashboard,
});

function OrgDashboard() {
	// 数据已在 loader 中预取，无加载状态
	const { data: members } = useSuspenseQuery(
		orpc.organization.listMembers.queryOptions({ input: {} }),
	);
	const { data: invitations } = useSuspenseQuery(
		orpc.organization.listInvitations.queryOptions({ input: {} }),
	);

	const membersCount = members?.members?.length ?? 0;
	const pendingInvitationsCount = invitations?.length ?? 0;

	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<div className="grid auto-rows-min gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Members</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-4xl">{membersCount}</div>
						<CardDescription>Total members in organization</CardDescription>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Pending Invitations</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-4xl">{pendingInvitationsCount}</div>
						<CardDescription>Pending invitations</CardDescription>
					</CardContent>
				</Card>
			</div>
			<div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" />
		</div>
	);
}
