import { useForm } from "@tanstack/react-form";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/(example)/posts/$id/edit")({
	component: RouteComponent,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			orpc.posts.getById.queryOptions({ input: { id: params.id } }),
		);
	},
});

function RouteComponent() {
	const { id: postId } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: post } = useSuspenseQuery(
		orpc.posts.getById.queryOptions({ input: { id: postId } }),
	);

	const updateMutation = useMutation({
		...orpc.posts.update.mutationOptions(),
		onMutate: async (updateData) => {
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
						posts: old.posts.map((p) =>
							p.id === postId ? { ...p, ...updateData } : p,
						),
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
			toast.success("更新成功");
			navigate({ to: "/posts" });
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.posts.list.key(),
			});
		},
	});

	const form = useForm({
		defaultValues: {
			title: post?.title ?? "",
			content: post?.content ?? "",
		},
		onSubmit: async ({ value }) => {
			const updateData: Record<string, string> = {};
			if (value.title) updateData.title = value.title;
			if (value.content) updateData.content = value.content;

			updateMutation.mutate({ id: postId, ...updateData });
		},
	});

	return (
		<div className="container mx-auto max-w-2xl p-8">
			<h1 className="mb-6 font-bold text-3xl">编辑文章</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				<form.Field name="title">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>标题</Label>
							<Input
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="请输入文章标题"
							/>
						</div>
					)}
				</form.Field>

				<form.Field name="content">
					{(field) => (
						<div className="space-y-2">
							<Label htmlFor={field.name}>内容</Label>
							<Textarea
								id={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder="请输入文章内容"
								rows={10}
							/>
						</div>
					)}
				</form.Field>

				<div className="flex gap-4">
					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								disabled={!state.canSubmit || state.isSubmitting}
							>
								{state.isSubmitting ? "保存中..." : "保存修改"}
							</Button>
						)}
					</form.Subscribe>
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate({ to: "/posts" })}
					>
						取消
					</Button>
				</div>
			</form>
		</div>
	);
}
