import { auth } from "@org-sass/auth";

export async function createContext({ req }: { req?: Request }) {
	const session = req
		? await auth.api.getSession({
				headers: req.headers,
			})
		: null;

	return {
		session,
		req,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
