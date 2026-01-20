import {
	AudioWaveform,
	Command,
	GalleryVerticalEnd,
	LayoutDashboard,
	Settings2,
	Users,
} from "lucide-react";
import type * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "../-components/nav-main";

import { NavUser } from "../-components/nav-user";
import { OrgSwitcher } from "./org-switcher";

// This is sample data.
const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg",
	},
	orgs: [
		{
			name: "Acme Inc",
			logo: GalleryVerticalEnd,
			plan: "Enterprise",
		},
		{
			name: "Acme Corp.",
			logo: AudioWaveform,
			plan: "Startup",
		},
		{
			name: "Evil Corp.",
			logo: Command,
			plan: "Free",
		},
	],
	navMain: [
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
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<OrgSwitcher orgs={data.orgs} />
			</SidebarHeader>
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
