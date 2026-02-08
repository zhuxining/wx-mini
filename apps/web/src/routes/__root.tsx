import { StyleProvider } from "@ant-design/cssinjs";
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
import { AntdThemeProvider } from "@/components/antd-theme-provider";
import type { orpc } from "@/utils/orpc";
import appCss from "../index.css?url";

export interface RouterAppContext {
	orpc: typeof orpc;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
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
	errorComponent: ({ error }) => {
		// if (error instanceof NotFoundError) {
		// 	return <NotFoundPage />;
		// }
		// if (error instanceof ForbiddenError) {
		// 	return <ForbiddenPage error={error} />;
		// }
		// if (error instanceof UnauthorizedError) {
		// 	return <UnauthorizedPage error={error} />;
		// }
		throw error;
	},
	component: RootDocument,
});

function RootDocument() {
	return (
		<html lang="zh">
			<head>
				<HeadContent />
			</head>
			<body>
				<StyleProvider layer>
					<AntdThemeProvider>
						<div style={{ minHeight: "100vh" }}>
							<Outlet />
						</div>
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
					</AntdThemeProvider>
				</StyleProvider>
				<Scripts />
			</body>
		</html>
	);
}
