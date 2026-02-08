import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge, Card, Flex, Space, Typography } from "antd";
import { ThemeToggle } from "@/components/theme-toggle";
import { orpc } from "@/utils/orpc";

const { Text } = Typography;

export const Route = createFileRoute("/")({
	ssr: "data-only",
	component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
	const healthCheck = useQuery(orpc.healthCheck.queryOptions());

	return (
		<div style={{ maxWidth: 800, margin: "0 auto", padding: "24px" }}>
			<pre
				style={{
					overflowX: "auto",
					fontFamily: "monospace",
					fontSize: "12px",
					lineHeight: "1.2",
					marginBottom: "24px",
				}}
			>
				{TITLE_TEXT}
			</pre>

			<Space vertical size="large" style={{ width: "100%" }}>
				<Card title="API Status">
					<Flex align="center" gap="small">
						<Badge
							status={healthCheck.data ? "success" : "error"}
							text={
								<Text type="secondary">
									{healthCheck.isLoading
										? "Checking..."
										: healthCheck.data
											? "Connected"
											: "Disconnected"}
								</Text>
							}
						/>
					</Flex>
				</Card>

				<Card title="Default size card" style={{ width: 300 }}>
					<p>Card content</p>
					<p>Card content</p>
					<p>Card content</p>
				</Card>

				<div style={{ width: 300 }}>
					<ThemeToggle />
				</div>

				<Card size="small" title="Small size card" style={{ width: 300 }}>
					<p>Card content</p>
					<p>Card content</p>
					<p>Card content</p>
				</Card>
			</Space>
		</div>
	);
}
