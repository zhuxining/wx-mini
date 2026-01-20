import { Building2, Settings2, Users } from "lucide-react";
import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";

import { NavUser } from "./nav-user";

const data = {
	user: {
		name: "Admin",
		email: "admin@example.com",
		avatar: "/avatars/admin.jpg",
	},
	navMain: [
		{
			title: "Organizations",
			url: "/admin/organizations",
			icon: Building2,
			isActive: true,
			items: [],
		},
		{
			title: "Users",
			url: "/admin/users",
			icon: Users,
			items: [],
		},
		{
			title: "Settings",
			url: "/admin/settings",
			icon: Settings2,
			items: [],
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader />
			<SidebarContent>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
