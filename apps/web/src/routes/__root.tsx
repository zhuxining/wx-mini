import type { Context } from "@org-sass/api/context";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import type { orpc } from "@/utils/orpc";
import appCss from "../index.css?url";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
	session: Context["session"];
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
	beforeLoad: async ({ context }) => {
		// 1. 尝试从 Router Context 获取 (Server Side Middleware)
		if (context.session) {
			return { session: context.session };
		}

		// 2. 尝试从 QueryClient 获取 (Client Side Hydration)
		const session = context.queryClient.getQueryData<Context["session"]>([
			"session",
		]);

		// 🔍 调试日志: 确认 Root 路由解析到了 session
		console.log("🔍 Root Route session resolution:", !!session);

		return { session };
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "My App",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	errorComponent: ({ error, reset }) => (
		<ErrorBoundary error={error} reset={reset} />
	),
	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="zh" className="light">
			<head>
				<HeadContent />
			</head>
			<body>
				<div className="h-svh">
					<Outlet />
				</div>
				<Toaster richColors />
				<TanStackDevtools
					plugins={[
						{
							name: "TanStack Query",
							render: <ReactQueryDevtoolsPanel />,
						},
						{
							name: "TanStack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						{
							name: "TanStack Form",
							render: <FormDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
