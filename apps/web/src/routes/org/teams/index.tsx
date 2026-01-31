import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";
import { TeamForm } from "./-components/team-form";

export const Route = createFileRoute("/org/teams/")({
	component: TeamsPage,
});

function TeamsPage() {
	const { confirm, ConfirmDialogComponent } = useConfirmDialog();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingTeam, setEditingTeam] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [editName, setEditName] = useState("");

	// 获取当前活跃组织信息
	const { data: session } = useSuspenseQuery(orpc.privateData.queryOptions());

	const organizationId = (
		session?.user as {
			activeOrganizationId?: string | null;
		}
	)?.activeOrganizationId;

	// 获取团队列表
	const { data: teams, refetch: refetchTeams } = useSuspenseQuery({
		queryKey: ["organization", "teams", organizationId],
		queryFn: async () => {
			if (!organizationId) return { teams: [] };
			const result = await authClient.organization.listTeams({
				query: { organizationId },
			});
			return result;
		},
	});

	// 创建团队
	const createTeam = useMutation({
		mutationFn: async (name: string) => {
			if (!organizationId) throw new Error("No active organization");
			return authClient.organization.createTeam({
				name,
				organizationId,
			});
		},
		onSuccess: () => {
			toast.success("Team created successfully");
			setIsCreateOpen(false);
			refetchTeams();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create team");
		},
	});

	// 更新团队
	const updateTeam = useMutation({
		mutationFn: async ({ teamId, name }: { teamId: string; name: string }) => {
			return authClient.organization.updateTeam({
				teamId,
				data: { name },
			});
		},
		onSuccess: () => {
			toast.success("Team updated successfully");
			setEditingTeam(null);
			refetchTeams();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update team");
		},
	});

	// 删除团队
	const deleteTeam = useMutation({
		mutationFn: async (teamId: string) => {
			// Better-Auth 客户端删除团队方法
			return fetch("/api/organization/delete-team", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ teamId }),
			});
		},
		onSuccess: () => {
			toast.success("Team deleted successfully");
			refetchTeams();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to delete team");
		},
	});

	const handleCreateTeam = (name: string) => {
		createTeam.mutate(name);
	};

	const handleEditTeam = () => {
		if (editingTeam && editName) {
			updateTeam.mutate({ teamId: editingTeam.id, name: editName });
		}
	};

	const handleDeleteTeam = async (teamId: string) => {
		const confirmed = await confirm({
			title: "Delete Team",
			description:
				"Are you sure you want to delete this team? This action cannot be undone.",
			variant: "destructive",
		});
		if (confirmed) {
			deleteTeam.mutate(teamId);
		}
	};

	const openEditDialog = (teamId: string, currentName: string) => {
		setEditingTeam({ id: teamId, name: currentName });
		setEditName(currentName);
	};

	const teamsList =
		(teams as { teams?: { id: string; name: string }[] } | null)?.teams ?? [];

	return (
		<>
			{ConfirmDialogComponent}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Teams</h1>
					<p className="text-muted-foreground">
						Manage teams and their members.
					</p>
				</div>
				<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
					<DialogTrigger className={buttonVariants()}>
						<Plus className="mr-2 h-4 w-4" />
						Create Team
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create Team</DialogTitle>
							<DialogDescription>
								Create a new team to organize members.
							</DialogDescription>
						</DialogHeader>
						<TeamForm
							onSubmit={handleCreateTeam}
							onCancel={() => setIsCreateOpen(false)}
							isLoading={createTeam.isPending}
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* Edit Dialog */}
			{editingTeam && (
				<Dialog
					open={!!editingTeam}
					onOpenChange={(open) => !open && setEditingTeam(null)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Team</DialogTitle>
							<DialogDescription>Update the team name.</DialogDescription>
						</DialogHeader>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="edit-name">Team Name</Label>
								<Input
									id="edit-name"
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									placeholder="Enter team name"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setEditingTeam(null)}
							>
								Cancel
							</Button>
							<Button
								type="button"
								onClick={handleEditTeam}
								disabled={updateTeam.isPending || !editName}
							>
								{updateTeam.isPending ? "Saving..." : "Save"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{/* Teams Grid */}
			{teamsList.length === 0 ? (
				<div className="flex min-h-100 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
					<Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 className="font-semibold text-lg">No teams yet</h3>
					<p className="mb-4 text-muted-foreground text-sm">
						Create your first team to get started.
					</p>
					<Button onClick={() => setIsCreateOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Create Team
					</Button>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{teamsList.map((team) => (
						<div
							key={team.id}
							className="group flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
						>
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
										<Building2 className="h-5 w-5" />
									</div>
									<div>
										<h3 className="font-medium">{team.name}</h3>
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger
										className={buttonVariants({
											variant: "ghost",
											size: "icon",
										})}
									>
										<MoreHorizontal className="h-4 w-4" />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() => openEditDialog(team.id, team.name)}
										>
											<Edit className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-destructive focus:text-destructive"
											onClick={() => handleDeleteTeam(team.id)}
											disabled={deleteTeam.isPending}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
}
