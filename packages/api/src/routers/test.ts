import { publicProcedure } from "../index";

export const testRouter = {
	testHealthCheck: publicProcedure.handler(() => {
		return "OK Test";
	}),
};
