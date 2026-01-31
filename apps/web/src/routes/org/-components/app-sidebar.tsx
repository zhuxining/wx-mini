import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { Building, LayoutDashboard, Settings2, Users } from "lucide-react";
import type * as React from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { orpc } from "@/utils/orpc";
import { NavUser } from "./nav-user";
import { OrgSwitcher } from "./org-switcher";

interface NavItem {
	title: string;
	url: string;
	icon?: React.ComponentType<{ className?: string }>;
	isActive?: boolean;
	items?: {
		title: string;
		url: string;
	}[];
}

// Inline NavMain component
function NavMain({
	items,
	groupLabel = "Platform",
}: {
	items: NavItem[];
	groupLabel?: string;
}) {
	const location = useLocation();

	const isActive = (url: string) => {
		return location.pathname.startsWith(url);
	};

	return (
		<SidebarGroup>
			<SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						defaultOpen={item.isActive || isActive(item.url)}
						className="group/collapsible"
					>
						<SidebarMenuItem>
							<CollapsibleTrigger
								render={
									<SidebarMenuButton tooltip={item.title}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
										{item.items && item.items.length > 0 && (
											<span className="ml-auto">{"->"}</span>
										)}
									</SidebarMenuButton>
								}
							/>
							{item.items && item.items.length > 0 && (
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													render={<Link to={subItem.url} />}
												>
													<span>{subItem.title}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							)}
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

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
		title: "Teams",
		url: "/org/teams",
		icon: Building,
		items: [],
	},
	{
		title: "Settings",
		url: "/org/settings",
		icon: Settings2,
		items: [
			{ title: "Profile", url: "/org/settings/profile" },
			{ title: "Dangerous Zone", url: "/org/settings/dangerous" },
		],
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
