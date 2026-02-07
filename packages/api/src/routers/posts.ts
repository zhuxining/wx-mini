import { and, db, desc, eq, gt, like, lt, or, post, sql } from "@org-sass/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../index";

export const postsRouter = {
	// CREATE - 创建文章
	create: protectedProcedure
		.input(
			z.object({
				title: z.string().min(1, "标题不能为空").max(200, "标题最多200字符"),
				content: z.string().min(1, "内容不能为空"),
			}),
		)
		.handler(async ({ input, context }) => {
			const newPost = await db
				.insert(post)
				.values({
					title: input.title,
					content: input.content,
					userId: context.session.user.id,
				})
				.returning();

			return newPost[0];
		}),

	// READ - 获取单个文章
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const result = await db.query.post.findFirst({
				where: eq(post.id, input.id),
				with: {
					user: true,
				},
			});

			if (!result) {
				throw new ORPCError("NOT_FOUND", { message: "文章不存在" });
			}

			return result;
		}),

	// READ - 列表文章（带分页和搜索）
	list: protectedProcedure
		.input(
			z.object({
				page: z.number().optional().default(1),
				perPage: z.number().optional().default(10),
				search: z.string().optional(),
				// 按列过滤
				title: z.string().optional(),
				userName: z.string().optional(),
				createdAtFrom: z.number().optional(), // timestamp
				createdAtTo: z.number().optional(), // timestamp
			}),
		)
		.handler(async ({ input }) => {
			const {
				page,
				perPage,
				search,
				title,
				userName,
				createdAtFrom,
				createdAtTo,
			} = input;
			const offset = (page - 1) * perPage;

			// 构建过滤条件
			const conditions = [];

			// 全局搜索
			if (search) {
				conditions.push(
					or(
						like(post.title, `%${search}%`),
						like(post.content, `%${search}%`),
					),
				);
			}

			// 标题过滤
			if (title) {
				conditions.push(like(post.title, `%${title}%`));
			}

			// 作者过滤（需要 join user 表）
			// 注意：这里使用子查询或 in 条件
			if (userName) {
				conditions.push(
					sql`${post.userId} IN (SELECT id FROM "user" WHERE ${sql`"user".name`} LIKE ${`%${userName}%`})`,
				);
			}

			// 创建时间范围过滤
			if (createdAtFrom) {
				const fromDate = new Date(createdAtFrom);
				fromDate.setHours(0, 0, 0, 0);
				conditions.push(gt(post.createdAt, fromDate));
			}

			if (createdAtTo) {
				const toDate = new Date(createdAtTo);
				toDate.setHours(23, 59, 59, 999);
				conditions.push(lt(post.createdAt, toDate));
			}

			// 组合所有条件
			const whereClause =
				conditions.length > 0 ? and(...conditions) : undefined;

			const posts = await db.query.post.findMany({
				where: whereClause,
				with: {
					user: true,
				},
				orderBy: [desc(post.createdAt)],
				limit: perPage,
				offset,
			});

			// 计算总数时也应用相同的过滤条件
			const countResult = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(post)
				.where(whereClause);
			const totalCount = countResult[0]?.count ?? 0;

			return { posts, totalCount, page, perPage };
		}),

	// UPDATE - 更新文章
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1).max(200).optional(),
				content: z.string().min(1).optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			// 验证权限：只能修改自己的文章
			const existingPost = await db.query.post.findFirst({
				where: eq(post.id, input.id),
			});

			if (!existingPost) {
				throw new ORPCError("NOT_FOUND", { message: "文章不存在" });
			}

			if (existingPost.userId !== context.session.user.id) {
				throw new ORPCError("FORBIDDEN", { message: "无权修改此文章" });
			}

			const updated = await db
				.update(post)
				.set({
					title: input.title,
					content: input.content,
				})
				.where(eq(post.id, input.id))
				.returning();

			return updated[0];
		}),

	// DELETE - 删除文章
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			// 验证权限：只能删除自己的文章
			const existingPost = await db.query.post.findFirst({
				where: eq(post.id, input.id),
			});

			if (!existingPost) {
				throw new ORPCError("NOT_FOUND", { message: "文章不存在" });
			}

			if (existingPost.userId !== context.session.user.id) {
				throw new ORPCError("FORBIDDEN", { message: "无权删除此文章" });
			}

			await db.delete(post).where(eq(post.id, input.id));

			return { success: true };
		}),
};
