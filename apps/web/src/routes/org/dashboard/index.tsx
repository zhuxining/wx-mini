import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/org/dashboard/")({
	component: OrgDashboard,
});

function OrgDashboard() {
	// 获取当前活跃组织信息
	const { data: session } = useSuspenseQuery(orpc.privateData.queryOptions());

	const organizationId = (
		session?.user as {
			activeOrganizationId?: string | null;
		}
	)?.activeOrganizationId;

	// 获取成员数据
	const { data: members } = useQuery({
		queryKey: ["organization", "members", organizationId],
		queryFn: async () => {
			if (!organizationId) return { members: [] };
			return authClient.organization.listMembers({
				query: { organizationId },
			});
		},
		enabled: !!organizationId,
	});

	// 获取邀请数据
	const { data: invitations } = useQuery({
		queryKey: ["organization", "invitations", organizationId],
		queryFn: async () => {
			if (!organizationId) return [];
			return authClient.organization.listInvitations({
				query: { organizationId },
			});
		},
		enabled: !!organizationId,
	});

	const membersCount =
		(members as unknown as { members?: unknown[] } | null)?.members?.length ??
		0;
	const pendingInvitationsCount =
		(invitations as unknown as unknown[] | null)?.length ?? 0;

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
