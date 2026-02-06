import type { auth } from "@org-sass/auth";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	plugins: [
		organizationClient({
			teams: {
				enabled: true,
			},
			dynamicAccessControl: {
				enabled: true,
			},
		}),
	],
});

export type Session = typeof auth.$Infer.Session;
export type Organization = typeof auth.$Infer.Organization;
