import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MoreHorizontal, Plus, Shield, Trash2, X } from "lucide-react";
import { useState } from "react";

import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/org/members/")({
	component: OrgMembersPage,
});

function OrgMembersPage() {
	const { confirm, ConfirmDialogComponent } = useConfirmDialog();

	// 获取当前活跃组织信息
	const { data: session } = useSuspenseQuery(orpc.privateData.queryOptions());

	const organizationId = (
		session?.user as {
			activeOrganizationId?: string | null;
		}
	)?.activeOrganizationId;

	// 获取成员列表
	const { data: membersData, refetch: refetchMembers } = useSuspenseQuery({
		queryKey: ["organization", "members", organizationId],
		queryFn: async () => {
			if (!organizationId) return { members: [] };
			return authClient.organization.listMembers({
				query: { organizationId },
			});
		},
	});

	// 获取邀请列表
	const { data: invitationsData, refetch: refetchInvitations } =
		useSuspenseQuery({
			queryKey: ["organization", "invitations", organizationId],
			queryFn: async () => {
				if (!organizationId) return [];
				return authClient.organization.listInvitations({
					query: { organizationId },
				});
			},
		});

	const [isInviteOpen, setIsInviteOpen] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState("member");

	// 邀请成员
	const inviteMember = useMutation({
		mutationFn: async () => {
			if (!organizationId) throw new Error("No active organization");
			return authClient.organization.inviteMember({
				email: inviteEmail,
				role: inviteRole as "admin" | "member" | "owner",
				organizationId,
			});
		},
		onSuccess: () => {
			toast.success("Invitation sent successfully");
			setIsInviteOpen(false);
			setInviteEmail("");
			refetchInvitations();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to send invitation");
		},
	});

	// 移除成员
	const removeMember = useMutation({
		mutationFn: async (memberIdOrEmail: string) => {
			return authClient.organization.removeMember({
				memberIdOrEmail,
			});
		},
		onSuccess: () => {
			toast.success("Member removed successfully");
			refetchMembers();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to remove member");
		},
	});

	// 更新角色
	const updateRole = useMutation({
		mutationFn: async ({
			memberIdOrEmail,
			role,
		}: {
			memberIdOrEmail: string;
			role: "admin" | "member" | "owner";
		}) => {
			return authClient.organization.updateMemberRole({
				memberId: memberIdOrEmail,
				role,
			});
		},
		onSuccess: () => {
			toast.success("Member role updated successfully");
			refetchMembers();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update member role");
		},
	});

	// 取消邀请
	const cancelInvitation = useMutation({
		mutationFn: async (invitationId: string) => {
			return authClient.organization.cancelInvitation({
				invitationId,
			});
		},
		onSuccess: () => {
			toast.success("Invitation cancelled");
			refetchInvitations();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to cancel invitation");
		},
	});

	const handleInvite = (e: React.FormEvent) => {
		e.preventDefault();
		inviteMember.mutate();
	};

	const handleRemove = async (memberId: string) => {
		const confirmed = await confirm({
			title: "Remove Member",
			description: "Are you sure you want to remove this member?",
			variant: "destructive",
		});
		if (confirmed) {
			removeMember.mutate(memberId);
		}
	};

	const handleRoleChange = (memberId: string, newRole: string) => {
		updateRole.mutate({
			memberIdOrEmail: memberId,
			role: newRole as "admin" | "member" | "owner",
		});
	};

	const handleCancelInvite = async (invitationId: string) => {
		const confirmed = await confirm({
			title: "Cancel Invitation",
			description: "Cancel this invitation?",
			variant: "destructive",
		});
		if (confirmed) {
			cancelInvitation.mutate(invitationId);
		}
	};

	// 角色显示组件
	const _getRoleBadge = (role: string) => {
		switch (role) {
			case "owner":
				return (
					<Badge variant="default" className="gap-1">
						<Shield className="h-3 w-3" />
						Owner
					</Badge>
				);
			case "admin":
				return (
					<Badge variant="secondary" className="gap-1">
						<Shield className="h-3 w-3" />
						Moderator
					</Badge>
				);
			default:
				return (
					<Badge variant="outline" className="gap-1">
						{role.charAt(0).toUpperCase() + role.slice(1)}
					</Badge>
				);
		}
	};

	const members =
		(membersData as unknown as { members?: unknown[] } | null)?.members ?? [];
	const invitations = (invitationsData as unknown as unknown[] | null) ?? [];

	return (
		<>
			{ConfirmDialogComponent}
			<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl tracking-tight">Team Members</h1>
						<p className="text-muted-foreground">
							Manage who has access to this organization.
						</p>
					</div>

					<Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
						<DialogTrigger className={buttonVariants()}>
							<Plus className="mr-2 h-4 w-4" />
							Invite Member
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Invite Member</DialogTitle>
								<DialogDescription>
									Send an email invitation to join your organization.
								</DialogDescription>
							</DialogHeader>
							<form onSubmit={handleInvite} className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="email">Email Address</Label>
									<Input
										id="email"
										type="email"
										value={inviteEmail}
										onChange={(e) => setInviteEmail(e.target.value)}
										placeholder="colleague@company.com"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="role">Role</Label>
									<Select
										value={inviteRole}
										onValueChange={(val) => val && setInviteRole(val)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="member">Member</SelectItem>
											<SelectItem value="admin">Moderator</SelectItem>
											<SelectItem value="owner">Owner</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsInviteOpen(false)}
									>
										Cancel
									</Button>
									<Button type="submit" disabled={inviteMember.isPending}>
										{inviteMember.isPending ? "Sending..." : "Send Invitation"}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>

				<div className="overflow-hidden rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Joined At</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{members.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="h-24 text-center">
										No members found.
									</TableCell>
								</TableRow>
							) : (
								(members as unknown[]).map((member: unknown) => {
									const m = member as {
										id: string;
										user: { image?: string; name?: string; email: string };
										role: string;
										createdAt: string | Date;
									};
									return (
										<TableRow key={m.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="h-9 w-9">
														<AvatarImage src={m.user.image || ""} />
														<AvatarFallback>
															{m.user.name?.charAt(0) || "?"}
														</AvatarFallback>
													</Avatar>
													<div className="flex flex-col">
														<Link
															to="/org/members/$memberId"
															params={{ memberId: m.id }}
															className="font-medium hover:underline"
														>
															{m.user.name}
														</Link>
														<span className="text-muted-foreground text-xs">
															{m.user.email}
														</span>
													</div>
												</div>
											</TableCell>
											<TableCell>{_getRoleBadge(m.role)}</TableCell>
											<TableCell>
												{new Date(m.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell className="text-right">
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
														<DropdownMenuLabel>Change Role</DropdownMenuLabel>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleRoleChange(m.id, "member")}
														>
															Member
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleRoleChange(m.id, "admin")}
														>
															Moderator
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleRoleChange(m.id, "owner")}
														>
															Owner
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															className="text-destructive focus:text-destructive"
															onClick={() => handleRemove(m.id)}
														>
															<Trash2 className="mr-2 h-4 w-4" /> Remove
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>

				{invitations.length > 0 && (
					<div className="space-y-4">
						<h2 className="font-semibold text-lg tracking-tight">
							Pending Invitations
						</h2>
						<div className="overflow-hidden rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Email</TableHead>
										<TableHead>Role</TableHead>
										<TableHead>Sent At</TableHead>
										<TableHead>Expires At</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{(invitations as unknown[]).map((invite: unknown) => {
										const inv = invite as {
											id: string;
											email: string;
											role: string;
											createdAt: string | Date;
											expiresAt: string | Date;
										};
										return (
											<TableRow key={inv.id}>
												<TableCell>
													<div className="flex items-center gap-2">
														<Mail className="h-4 w-4 text-muted-foreground" />
														<span>{inv.email}</span>
													</div>
												</TableCell>
												<TableCell>{_getRoleBadge(inv.role)}</TableCell>
												<TableCell>
													{new Date(inv.createdAt).toLocaleDateString()}
												</TableCell>
												<TableCell>
													{new Date(inv.expiresAt).toLocaleDateString()}
												</TableCell>
												<TableCell className="text-right">
													<Button
														variant="ghost"
														size="sm"
														className="text-destructive hover:text-destructive"
														onClick={() => handleCancelInvite(inv.id)}
														disabled={cancelInvitation.isPending}
													>
														<X className="mr-2 h-4 w-4" />
														Cancel
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</div>
				)}
			</div>
		</>
	);
}
