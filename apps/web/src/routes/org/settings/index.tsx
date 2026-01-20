import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/org/settings/")({
	component: OrgSettingsPage,
});

function OrgSettingsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const {
		data: org,
		isLoading,
		error,
	} = useQuery(
		orpc.organization.getFullOrganization.queryOptions({ input: {} }),
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
					queryKey: orpc.organization.getFullOrganization.key(),
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
				navigate({ to: "/" });
			},
			onError: (err: Error) => {
				toast.error(`Failed to delete: ${err.message}`);
			},
		}),
	);

	const handleUpdate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!org) return;

		updateOrg.mutate({
			organizationId: org.id,
			data: { name, slug },
		});
	};

	const handleDelete = () => {
		if (!org) return;
		if (confirm("Are you sure? This action cannot be undone.")) {
			deleteOrg.mutate({ organizationId: org.id });
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
					Error loading organization details: {error?.message}
				</div>
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
								<BreadcrumbLink href="/org/dashboard">
									Organization
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem>
								<BreadcrumbPage>Settings</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>

			<div className="flex flex-1 flex-col gap-6 p-4 pt-0">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Settings</h1>
					<p className="text-muted-foreground">
						Manage your organization settings.
					</p>
				</div>

				<div className="grid max-w-2xl gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Organization Profile</CardTitle>
							<CardDescription>
								Update your organization's public information.
							</CardDescription>
						</CardHeader>
						<form onSubmit={handleUpdate}>
							<CardContent className="space-y-4">
								<div className="mb-4 flex items-center gap-4">
									<Avatar className="h-16 w-16">
										<AvatarImage src={org.logo || ""} />
										<AvatarFallback className="text-lg">
											{org.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<Button type="button" variant="outline" size="sm">
										Change Logo
									</Button>
								</div>

								<div className="space-y-2">
									<Label htmlFor="name">Organization Name</Label>
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
									<p className="text-muted-foreground text-xs">
										This is your organization's unique identifier used in URLs.
									</p>
								</div>
							</CardContent>
							<CardFooter className="flex justify-between border-t px-6 py-4">
								<div className="text-muted-foreground text-sm">
									Created on {new Date(org.createdAt).toLocaleDateString()}
								</div>
								<Button type="submit" disabled={updateOrg.isPending}>
									{updateOrg.isPending ? "Saving..." : "Save Changes"}
								</Button>
							</CardFooter>
						</form>
					</Card>

					<Card className="border-destructive/50">
						<CardHeader>
							<CardTitle className="text-destructive">Danger Zone</CardTitle>
							<CardDescription>
								Irreversible actions for your organization.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="mb-4 text-muted-foreground text-sm">
								Deleting your organization will remove all data, members, and
								resources associated with it. This action cannot be undone.
							</p>
							<Button
								variant="destructive"
								onClick={handleDelete}
								disabled={deleteOrg.isPending}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete Organization
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
