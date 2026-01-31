import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/org/settings/profile/")({
	component: OrganizationProfile,
});

function OrganizationProfile() {
	// 获取当前活跃组织信息
	const { data: session } = useSuspenseQuery(orpc.privateData.queryOptions());

	const organizationId = (
		session?.user as {
			activeOrganizationId?: string | null;
		}
	)?.activeOrganizationId;

	// 获取组织详细信息
	const { data: org, refetch: refetchOrg } = useSuspenseQuery({
		queryKey: ["organization", organizationId],
		queryFn: async () => {
			if (!organizationId) return null;
			const result = await authClient.organization.getFullOrganization({
				query: { organizationId },
			});
			return result;
		},
	});

	const [name, setName] = useState(
		(org as { organization?: { name?: string } } | null)?.organization?.name ||
			"",
	);
	const [isEditing, setIsEditing] = useState(false);

	// 更新组织名称
	const updateOrganization = useMutation({
		mutationFn: async (newName: string) => {
			if (!organizationId) throw new Error("No active organization");
			// Better-Auth 客户端更新组织方法
			return fetch("/api/organization/update", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					organizationId,
					data: { name: newName },
				}),
			});
		},
		onSuccess: () => {
			toast.success("Organization updated successfully");
			setIsEditing(false);
			refetchOrg();
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update organization");
		},
	});

	const handleSave = () => {
		if (name.trim()) {
			updateOrganization.mutate(name.trim());
		}
	};

	const handleCancel = () => {
		setName(
			(org as { organization?: { name?: string } } | null)?.organization
				?.name || "",
		);
		setIsEditing(false);
	};

	const organization = (
		org as {
			organization?: {
				name?: string;
				slug?: string;
				createdAt?: string | Date;
			};
		} | null
	)?.organization;
	if (!organization) {
		return <div>Loading...</div>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Organization Profile</CardTitle>
				<CardDescription>
					View and edit your organization information.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="org-name">Organization Name</Label>
						{isEditing ? (
							<Input
								id="org-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter organization name"
							/>
						) : (
							<div className="rounded-md border px-3 py-2 text-sm">
								{organization.name}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label>Organization Slug</Label>
						<div className="rounded-md border px-3 py-2 text-muted-foreground text-sm">
							{organization.slug}
						</div>
					</div>

					<div className="space-y-2">
						<Label>Created At</Label>
						<div className="rounded-md border px-3 py-2 text-muted-foreground text-sm">
							{organization.createdAt
								? new Date(organization.createdAt).toLocaleDateString()
								: "N/A"}
						</div>
					</div>

					<div className="flex gap-2">
						{isEditing ? (
							<>
								<Button
									onClick={handleSave}
									disabled={updateOrganization.isPending || !name.trim()}
								>
									{updateOrganization.isPending ? "Saving..." : "Save"}
								</Button>
								<Button
									variant="outline"
									onClick={handleCancel}
									disabled={updateOrganization.isPending}
								>
									Cancel
								</Button>
							</>
						) : (
							<Button onClick={() => setIsEditing(true)}>Edit</Button>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
