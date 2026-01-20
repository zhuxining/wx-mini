import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/admin/organizations/$orgId")({
	component: AdminOrganizationDetailPage,
});

function AdminOrganizationDetailPage() {
	const { orgId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const {
		data: org,
		isLoading,
		error,
	} = useQuery(
		orpc.organization.getFullOrganization.queryOptions({
			input: { organizationId: orgId },
		}),
	);

	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");

	useEffect(() => {
		if (org) {
			setName(org.name);
			setSlug(org.slug);
		}
	}, [org]);

	const updateOrg = useMutation(
		orpc.organization.updateOrganization.mutationOptions({
			onSuccess: () => {
				toast.success("Organization updated successfully");
				queryClient.invalidateQueries({
					queryKey: orpc.organization.listOrganizations.key(),
				});
			},
			onError: (err: Error) => {
				toast.error(`Failed to update: ${err.message}`);
			},
		}),
	);

	const deleteOrg = useMutation(
		orpc.organization.deleteOrganization.mutationOptions({
			onSuccess: () => {
				toast.success("Organization deleted");
				navigate({ to: "/admin/organizations" });
				queryClient.invalidateQueries({
					queryKey: orpc.organization.listOrganizations.key(),
				});
			},
			onError: (err: Error) => {
				toast.error(`Failed to delete: ${err.message}`);
			},
		}),
	);

	const handleUpdate = (e: React.FormEvent) => {
		e.preventDefault();
		updateOrg.mutate({
			organizationId: orgId,
			data: { name, slug },
		});
	};

	const handleDelete = () => {
		if (confirm("Are you sure? This action cannot be undone.")) {
			deleteOrg.mutate({ organizationId: orgId });
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4 p-8">
				<Skeleton className="h-12 w-1/3" />
				<Skeleton className="h-[400px] w-full" />
			</div>
		);
	}

	if (error || !org) {
		return (
			<div className="p-8">
				<div className="rounded-md bg-destructive/15 p-4 text-destructive">
					Organization not found or error loading details.
				</div>
				<Button variant="link" className="mt-4 px-0">
					<Link to="/admin/organizations">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Organizations
					</Link>
				</Button>
			</div>
		);
	}

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
								<BreadcrumbLink href="/admin/organizations">
									Organizations
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem>
								<BreadcrumbPage>{org.name}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
				<div className="flex items-center justify-between">
					<h1 className="font-bold text-2xl tracking-tight">
						Organization Details
					</h1>
					<Button variant="destructive" size="sm" onClick={handleDelete}>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete Organization
					</Button>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>General Information</CardTitle>
							<CardDescription>
								Update basic organization details.
							</CardDescription>
						</CardHeader>
						<form onSubmit={handleUpdate}>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="slug">Slug</Label>
									<Input
										id="slug"
										value={slug}
										onChange={(e) => setSlug(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label>Created At</Label>
									<div className="text-muted-foreground text-sm">
										{new Date(org.createdAt).toLocaleString()}
									</div>
								</div>
								<div className="space-y-2">
									<Label>Owner</Label>
									<div className="flex items-center gap-2">
										<Avatar className="h-6 w-6">
											<AvatarImage src={""} />
											<AvatarFallback>{"?"}</AvatarFallback>
										</Avatar>
										<span className="text-sm">{"No owner"}</span>
									</div>
								</div>
							</CardContent>
							<CardFooter>
								<Button type="submit" disabled={updateOrg.isPending}>
									<Save className="mr-2 h-4 w-4" />
									Save Changes
								</Button>
							</CardFooter>
						</form>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Members</CardTitle>
							<CardDescription>
								View organization members. (Read-only view for admin)
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="rounded-md bg-muted/30 p-4 text-center text-muted-foreground text-sm">
								<p>
									Member management for admins requires joining the organization
									context.
								</p>
								<p className="mt-2">Count: {0}</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
