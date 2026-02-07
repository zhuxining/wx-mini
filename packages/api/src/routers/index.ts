import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { betterAuthOpenAPIDocsRouter } from "./better-auth-openapi-docs";
import { postsRouter } from "./posts";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	betterAuthOpenAPIDocs: betterAuthOpenAPIDocsRouter,
	posts: postsRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
