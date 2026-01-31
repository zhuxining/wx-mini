import { createFileRoute } from "@tanstack/react-router";
import { requireOwner } from "@/utils/guards";
import { DangerousZone } from "./index";

export const Route = createFileRoute("/org/settings/dangerous")({
	beforeLoad: async ({ context, location }) => {
		// 只有 owner 可以访问
		await requireOwner({ context, location });
	},
	component: DangerousZone,
});
