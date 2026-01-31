import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { requireAdmin } from "@/utils/guards";

export const Route = createFileRoute("/org/settings")({
	beforeLoad: async ({ context, location }) => {
		// 需要 admin 或更高角色
		await requireAdmin({ context, location });
	},
	component: SettingsLayout,
});

function SettingsLayout() {
	return (
		<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Settings</h1>
					<p className="text-muted-foreground">
						Manage your organization settings and preferences.
					</p>
				</div>
			</div>
			<div className="grid gap-6 md:grid-cols-[200px_1fr]">
				<nav className="flex flex-col gap-1">
					<Link
						to="/org/settings/profile"
						className={[
							"justify-start",
							"hover:bg-muted",
							"rounded-md",
							"px-3 py-2",
							"font-medium text-sm",
						].join(" ")}
						activeProps={{ className: "bg-muted" }}
					>
						Profile
					</Link>
					<Link
						to="/org/settings/dangerous"
						className={[
							"justify-start",
							"hover:bg-muted",
							"rounded-md",
							"px-3 py-2",
							"font-medium text-sm",
							"text-destructive hover:text-destructive",
						].join(" ")}
						activeProps={{ className: "bg-muted" }}
					>
						Dangerous Zone
					</Link>
				</nav>
				<div>
					<Outlet />
				</div>
			</div>
		</div>
	);
}
