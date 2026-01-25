import { Building2, Users } from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";

import { NavUser } from "./nav-user";

// Admin navigation - Settings removed as page doesn't exist yet
const data = {
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
				<NavUser user={{ name: "", email: "" }} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
