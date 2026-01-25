import { useSuspenseQuery } from "@tanstack/react-query";
import { LayoutDashboard, Settings2, Users } from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { orpc } from "@/utils/orpc";

import { NavUser } from "../-components/nav-user";
import { OrgSwitcher } from "./org-switcher";

const navMainItems = [
	{
		title: "Dashboard",
		url: "/org/dashboard",
		icon: LayoutDashboard,
		isActive: true,
		items: [],
	},
	{
		title: "Members",
		url: "/org/members",
		icon: Users,
		items: [],
	},
	{
		title: "Settings",
		url: "/org/settings",
		icon: Settings2,
		items: [],
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { data: session } = useSuspenseQuery(orpc.privateData.queryOptions());

	const userData = {
		name: session.user.name,
		email: session.user.email,
	};

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<OrgSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMainItems} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
