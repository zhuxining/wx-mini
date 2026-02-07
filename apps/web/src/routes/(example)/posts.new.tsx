import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/(example)/posts/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { session } = Route.useRouteContext();

	const createMutation = useMutation({
		...orpc.posts.create.mutationOptions(),
		onMutate: async (newPost) => {
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
					const now = new Date();
					return {
						...old,
						posts: [
							{
								...newPost,
								id: `temp-${Date.now()}`,
								userId: session?.user?.id ?? "",
								createdAt: now,
								updatedAt: now,
								user: {
									id: session?.user?.id ?? "",
									name: session?.user?.name ?? "当前用户",
									email: "",
									emailVerified: false,
									image: null,
									createdAt: now,
									updatedAt: now,
								},
							},
							...old.posts,
						],
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
			toast.success("创建成功");
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
			title: "",
			content: "",
		},
		onSubmit: async ({ value }) => {
			const result = z
				.object({
					title: z.string().min(1, "标题不能为空").max(200, "标题最多200字符"),
					content: z.string().min(1, "内容不能为空"),
				})
				.safeParse(value);

			if (!result.success) {
				const firstError = result.error.issues[0];
				toast.error(firstError?.message ?? "验证失败");
				return;
			}

			await createMutation.mutateAsync(result.data);
		},
	});

	return (
		<div className="container mx-auto max-w-2xl p-8">
			<h1 className="mb-6 font-bold text-3xl">新建文章</h1>

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
								disabled={createMutation.isPending}
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
								disabled={createMutation.isPending}
							/>
						</div>
					)}
				</form.Field>

				<div className="flex gap-4">
					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								disabled={
									!state.canSubmit ||
									state.isSubmitting ||
									createMutation.isPending
								}
							>
								{state.isSubmitting ? "提交中..." : "创建文章"}
							</Button>
						)}
					</form.Subscribe>
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate({ to: "/posts" })}
						disabled={createMutation.isPending}
					>
						取消
					</Button>
				</div>
			</form>
		</div>
	);
}
