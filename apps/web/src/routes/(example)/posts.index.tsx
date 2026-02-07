import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import {
	ResponsiveDialog,
	ResponsiveDialogClose,
	ResponsiveDialogContent,
	ResponsiveDialogDescription,
	ResponsiveDialogFooter,
	ResponsiveDialogHeader,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import { useDataTable } from "@/hooks/use-data-table";
import { buildQueryParamsFromURL } from "@/lib/data-table-utilities";
import { orpc } from "@/utils/orpc";

// 定义 Post 类型 - 基于 API 返回结构
interface Post {
	id: string;
	title: string;
	content: string;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
	user: {
		name: string;
	};
}

const columnHelper = createColumnHelper<Post>();

const columns = [
	columnHelper.accessor("title", {
		header: "标题",
		enableColumnFilter: true,
		meta: {
			label: "标题",
			variant: "text",
			placeholder: "搜索标题...",
		},
	}),

	columnHelper.accessor("user.name", {
		header: "作者",
		enableColumnFilter: true,
		meta: {
			label: "作者",
			variant: "text",
			placeholder: "搜索作者...",
		},
	}),

	columnHelper.accessor("createdAt", {
		header: "创建时间",
		enableColumnFilter: true,
		meta: {
			label: "创建时间",
			variant: "date",
		},
		cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("zh-CN"),
	}),

	columnHelper.display({
		id: "actions",
		header: "操作",
		cell: ({ row }) => (
			<div className="flex justify-end gap-2">
				<Link to="/posts/$id/edit" params={{ id: row.original.id }}>
					<Button variant="ghost" size="icon">
						<Pencil className="size-4" />
					</Button>
				</Link>
				<DeleteButton post={row.original} />
			</div>
		),
	}),
];

export const Route = createFileRoute("/(example)/posts/")({
	component: PostsList,
	loader: async ({ context, location }) => {
		const params = new URLSearchParams(location.search);
		const queryParams = buildQueryParamsFromURL(params);

		await context.queryClient.ensureQueryData(
			orpc.posts.list.queryOptions({
				input: queryParams,
			}),
		);
	},
});

function DeleteButton({ post }: { post: Post }) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		...orpc.posts.delete.mutationOptions(),
		onMutate: async ({ id }) => {
			await queryClient.cancelQueries({
				queryKey: orpc.posts.list.key(),
			});

			const previousData = queryClient.getQueryData(
				orpc.posts.list.queryKey({ input: { page: 1, perPage: 50 } }),
			);

			queryClient.setQueryData(
				orpc.posts.list.queryKey({ input: { page: 1, perPage: 50 } }),
				(old) => {
					if (!old) return old;
					return {
						...old,
						posts: old.posts.filter((p) => p.id !== id),
					};
				},
			);

			return { previousData };
		},
		onError: (error, _variables, context) => {
			if (context?.previousData) {
				queryClient.setQueryData(
					orpc.posts.list.queryKey({ input: { page: 1, perPage: 50 } }),
					context.previousData,
				);
			}
			toast.error(error.message);
		},
		onSuccess: () => {
			toast.success("删除成功");
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.posts.list.key(),
			});
		},
	});

	return (
		<ResponsiveDialog open={open} onOpenChange={setOpen}>
			<ResponsiveDialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<Trash2 className="size-4" />
				</Button>
			</ResponsiveDialogTrigger>
			<ResponsiveDialogContent>
				<ResponsiveDialogHeader>
					<ResponsiveDialogTitle>确认删除</ResponsiveDialogTitle>
					<ResponsiveDialogDescription>
						确定要删除文章「{post.title}」吗？此操作无法撤销。
					</ResponsiveDialogDescription>
				</ResponsiveDialogHeader>
				<ResponsiveDialogFooter>
					<ResponsiveDialogClose asChild>
						<Button variant="outline">取消</Button>
					</ResponsiveDialogClose>
					<Button onClick={() => deleteMutation.mutate({ id: post.id })}>
						删除
					</Button>
				</ResponsiveDialogFooter>
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
}

function PostsList() {
	const location = useLocation();
	const queryParams = buildQueryParamsFromURL(
		new URLSearchParams(location.search),
	);

	const { data } = useSuspenseQuery(
		orpc.posts.list.queryOptions({
			input: queryParams,
		}),
	);

	const table = useDataTable({
		columns,
		pageCount: Math.ceil((data?.totalCount ?? 0) / 50),
		data: data?.posts ?? [],
		queryKeys: {
			page: "page",
			perPage: "perPage",
			sort: "sort",
			filters: "filters",
		},
	});

	return (
		<div className="container mx-auto p-8">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="font-bold text-3xl">文章列表</h1>
				<Link to="/posts/new">
					<Button>新建文章</Button>
				</Link>
			</div>

			<DataTableToolbar table={table.table} />
			<DataTable table={table.table} />
		</div>
	);
}
