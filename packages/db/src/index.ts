import { env } from "@org-sass/env/server";
import { and, desc, eq, gt, like, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

export const db: PostgresJsDatabase<typeof schema> = drizzle(env.DATABASE_URL, {
	schema,
});

// Re-export drizzle-orm utilities
export { and, desc, eq, gt, like, lt, or, sql };

// Re-export schema
export * from "./schema";
