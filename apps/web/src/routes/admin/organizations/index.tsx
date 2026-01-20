import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/organizations/")({
	component: AdminOrganizationsPage,
});

function AdminOrganizationsPage() {
	const {
		data: orgs,
		isLoading,
		error,
	} = useQuery(orpc.organization.listOrganizations.queryOptions());
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [newOrgName, setNewOrgName] = useState("");
	const [newOrgSlug, setNewOrgSlug] = useState("");

	const createOrg = useMutation(
		orpc.organization.createOrganization.mutationOptions({
			onSuccess: () => {
				toast.success("Organization created successfully");
				setIsCreateOpen(false);
				setNewOrgName("");
				setNewOrgSlug("");
				queryClient.invalidateQueries({
					queryKey: orpc.organization.listOrganizations.key(),
				});
			},
			onError: (err: Error) => {
				toast.error(`Failed to create organization: ${err.message}`);
			},
		}),
	);

	const deleteOrg = useMutation(
		orpc.organization.deleteOrganization.mutationOptions({
			onSuccess: () => {
				toast.success("Organization deleted");
				queryClient.invalidateQueries({
					queryKey: orpc.organization.listOrganizations.key(),
				});
			},
			onError: (err: Error) => {
				toast.error(`Failed to delete organization: ${err.message}`);
			},
		}),
	);

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newOrgName || !newOrgSlug) return;
		createOrg.mutate({ name: newOrgName, slug: newOrgSlug });
	};

	const handleDelete = (id: string, name: string) => {
		if (
			confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)
		) {
			deleteOrg.mutate({ organizationId: id });
		}
	};

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mr-2 data-[orientation=vertical]:h-4"
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className="hidden md:block">
								<BreadcrumbLink href="/admin/dashboard">Admin</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem>
								<BreadcrumbPage>Organizations</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl tracking-tight">Organizations</h1>
						<p className="text-muted-foreground">
							Manage all organizations in the system.
						</p>
					</div>

					<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
						<DialogTrigger
							className={buttonVariants({
								className: "cursor-pointer",
							})}
						>
							<Plus className="mr-2 h-4 w-4" />
							Create Organization
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create Organization</DialogTitle>
								<DialogDescription>
									Enter the details for the new organization.
								</DialogDescription>
							</DialogHeader>
							<form onSubmit={handleCreate} className="space-y-4 py-4">
								<div className="space-y-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										value={newOrgName}
										onChange={(e) => setNewOrgName(e.target.value)}
										placeholder="Acme Corp"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="slug">Slug</Label>
									<Input
										id="slug"
										value={newOrgSlug}
										onChange={(e) => setNewOrgSlug(e.target.value)}
										placeholder="acme-corp"
										required
									/>
								</div>
								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsCreateOpen(false)}
									>
										Cancel
									</Button>
									<Button type="submit" disabled={createOrg.isPending}>
										{createOrg.isPending ? "Creating..." : "Create"}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>

				{isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : error ? (
					<div className="rounded-md bg-destructive/15 p-4 text-destructive">
						Error loading organizations: {error.message}
					</div>
				) : (
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Slug</TableHead>
									<TableHead>Owner</TableHead>
									<TableHead>Members</TableHead>
									<TableHead>Created At</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orgs?.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="h-24 text-center">
											No organizations found.
										</TableCell>
									</TableRow>
								) : (
									orgs?.map((org) => (
										<TableRow
											key={org.id}
											className="cursor-pointer hover:bg-muted/50"
											onClick={() =>
												navigate({ to: `/admin/organizations/${org.id}` })
											}
										>
											<TableCell className="font-medium">{org.name}</TableCell>
											<TableCell>{org.slug}</TableCell>
											<TableCell>{"Unknown"}</TableCell>
											<TableCell>{0}</TableCell>
											<TableCell>
												{new Date(org.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell className="text-right">
												<div
													className="flex justify-end gap-2"
													onClick={(e) => e.stopPropagation()}
													onKeyDown={(e) => e.stopPropagation()}
													role="none"
												>
													<Button variant="ghost" size="icon">
														<Link
															to={"/admin/organizations/$orgId"}
															params={{ orgId: org.id }}
														>
															<Eye className="h-4 w-4" />
														</Link>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-destructive hover:bg-destructive/10 hover:text-destructive"
														onClick={(e) => {
															e.stopPropagation();
															handleDelete(org.id, org.name);
														}}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</>
	);
}
