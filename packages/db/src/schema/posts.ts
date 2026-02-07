import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const post = pgTable(
	"post",
	{
		id: text("id").primaryKey().default(sql`uuidv7()`),
		title: text("title").notNull(),
		content: text("content").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("post_user_id_idx").on(table.userId)],
);

export const postRelations = relations(post, ({ one }) => ({
	user: one(user, {
		fields: [post.userId],
		references: [user.id],
	}),
}));
