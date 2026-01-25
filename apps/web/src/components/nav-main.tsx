import { Link, useLocation } from "@tanstack/react-router";
import { ChevronsUpDown, type LucideIcon } from "lucide-react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: {
		title: string;
		url: string;
	}[];
}

interface NavMainProps {
	items: NavItem[];
	groupLabel?: string;
}

export function NavMain({ items, groupLabel = "Platform" }: NavMainProps) {
	const location = useLocation();

	// Check if the current URL matches the item URL
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
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={item.title} asChild>
									<Link to={item.url}>
										{item.icon && <item.icon />}
										<span>{item.title}</span>
										{item.items && item.items.length > 0 && (
											<ChevronsUpDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										)}
									</Link>
								</SidebarMenuButton>
							</CollapsibleTrigger>
							{item.items && item.items.length > 0 && (
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton asChild>
													<Link to={subItem.url}>
														<span>{subItem.title}</span>
													</Link>
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
