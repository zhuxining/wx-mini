import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/org/settings/dangerous/")({
	component: DangerousZone,
});

export function DangerousZone() {
	// 获取当前活跃组织信息
	const { data: session } = useSuspenseQuery(orpc.privateData.queryOptions());

	const organizationId = (
		session?.user as {
			activeOrganizationId?: string | null;
		}
	)?.activeOrganizationId;

	// 获取组织成员列表
	const { data: membersData, refetch: refetchMembers } = useSuspenseQuery({
		queryKey: ["organization", "members", organizationId],
		queryFn: async () => {
			if (!organizationId) return { members: [] };
			const result = await authClient.organization.listMembers({
				query: { organizationId },
			});
			return result;
		},
	});

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [transferDialogOpen, setTransferDialogOpen] = useState(false);
	const [confirmDeleteName, setConfirmDeleteName] = useState("");
	const [transferToMemberId, setTransferToMemberId] = useState("");

	// 删除组织
	const deleteOrganization = useMutation({
		mutationFn: async () => {
			if (!organizationId) throw new Error("No active organization");
			// Better-Auth 客户端删除组织方法
			return fetch("/api/organization/delete", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ organizationId }),
			});
		},
		onSuccess: () => {
			toast.success("Organization deleted successfully");
			setDeleteDialogOpen(false);
			// 刷新页面或跳转到首页
			window.location.href = "/";
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete organization");
		},
	});

	// 转让组织（组合操作：将目标成员设为 owner，当前 owner 设为 admin）
	const transferOrganization = useMutation({
		mutationFn: async (targetMemberId: string) => {
			if (!organizationId) throw new Error("No active organization");

			// 1. 获取当前成员信息
			const currentMember = await authClient.organization.getActiveMember();

			// 2. 将目标成员设为 owner
			await authClient.organization.updateMemberRole({
				memberId: targetMemberId,
				role: "owner",
			});

			// 3. 将当前 owner 设为 admin
			const memberId = (currentMember as { id?: string } | null)?.id;
			if (memberId) {
				await authClient.organization.updateMemberRole({
					memberId: memberId,
					role: "admin",
				});
			}
		},
		onSuccess: () => {
			toast.success("Organization transferred successfully");
			setTransferDialogOpen(false);
			refetchMembers();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to transfer organization");
		},
	});

	const handleDeleteOrganization = () => {
		const owner = (members as unknown[]).find(
			(m: unknown) => (m as { role: string }).role === "owner",
		) as { organization?: { name?: string } } | undefined;
		const orgName = owner?.organization?.name;

		if (confirmDeleteName !== orgName) {
			toast.error("Organization name does not match");
			return;
		}

		deleteOrganization.mutate();
	};

	const handleTransferOrganization = () => {
		if (!transferToMemberId) {
			toast.error("Please select a member");
			return;
		}

		transferOrganization.mutate(transferToMemberId);
	};

	const members =
		(membersData as unknown as { members?: unknown[] } | null)?.members ?? [];
	const owners = (members as unknown[]).filter(
		(m: unknown) => (m as { role: string }).role === "owner",
	);
	const orgName =
		(owners[0] as { organization?: { name?: string } })?.organization?.name ||
		"";

	return (
		<div className="space-y-6">
			{/* Transfer Ownership */}
			<Card className="border-destructive">
				<CardHeader>
					<CardTitle className="text-destructive">Transfer Ownership</CardTitle>
					<CardDescription>
						Transfer ownership of this organization to another member. You will
						become an admin after the transfer.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Dialog
						open={transferDialogOpen}
						onOpenChange={setTransferDialogOpen}
					>
						<DialogTrigger
							className={buttonVariants({ variant: "destructive" })}
						>
							Transfer Ownership
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Transfer Ownership</DialogTitle>
								<DialogDescription>
									Select a member to transfer ownership to. You will become an
									admin after the transfer.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Select
										value={transferToMemberId}
										onValueChange={(v) => v && setTransferToMemberId(v)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select a member" />
										</SelectTrigger>
										<SelectContent>
											{(members as unknown[])
												.filter(
													(m: unknown) =>
														(m as { role: string }).role !== "owner",
												)
												.map((m: unknown) => {
													const member = m as {
														id: string;
														user: { name?: string; email: string };
													};
													return (
														<SelectItem key={member.id} value={member.id}>
															{member.user.name || member.user.email}
														</SelectItem>
													);
												})}
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setTransferDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="button"
									variant="destructive"
									onClick={handleTransferOrganization}
									disabled={
										transferOrganization.isPending || !transferToMemberId
									}
								>
									{transferOrganization.isPending
										? "Transferring..."
										: "Transfer"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardContent>
			</Card>

			{/* Delete Organization */}
			<Card className="border-destructive">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Delete Organization
					</CardTitle>
					<CardDescription>
						Permanently delete this organization and all its data. This action
						cannot be undone.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
						<DialogTrigger
							className={buttonVariants({ variant: "destructive" })}
						>
							Delete Organization
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Delete Organization</DialogTitle>
								<DialogDescription>
									Are you sure you want to delete this organization? All data
									will be permanently lost.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<p className="text-muted-foreground text-sm">
									Type the organization name <strong>{orgName}</strong> to
									confirm.
								</p>
								<input
									type="text"
									value={confirmDeleteName}
									onChange={(e) => setConfirmDeleteName(e.target.value)}
									placeholder={orgName}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
								/>
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setDeleteDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="button"
									variant="destructive"
									onClick={handleDeleteOrganization}
									disabled={
										deleteOrganization.isPending ||
										confirmDeleteName !== orgName
									}
								>
									{deleteOrganization.isPending ? "Deleting..." : "Delete"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</CardContent>
			</Card>
		</div>
	);
}
