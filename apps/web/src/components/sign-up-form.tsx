import { useNavigate } from "@tanstack/react-router";
import { App, Button, Form, Input } from "antd";
import type { Rule } from "antd/es/form";
import { authClient } from "@/lib/auth-client";

interface SignUpFormValues {
	name: string;
	email: string;
	password: string;
}

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const navigate = useNavigate({ from: "/" });
	const { message } = App.useApp();
	const [form] = Form.useForm<SignUpFormValues>();

	const nameRules: Rule[] = [
		{ required: true, message: "Please input your name" },
		{ min: 2, message: "Name must be at least 2 characters" },
	];

	const emailRules: Rule[] = [
		{ required: true, message: "Please input your email" },
		{ type: "email", message: "Invalid email address" },
	];

	const passwordRules: Rule[] = [
		{ required: true, message: "Please input your password" },
		{ min: 8, message: "Password must be at least 8 characters" },
	];

	const handleSubmit = async (values: SignUpFormValues) => {
		await authClient.signUp.email(
			{ email: values.email, password: values.password, name: values.name },
			{
				onSuccess: () => {
					navigate({ to: "/" });
					message.success("注册成功！请联系系统管理员创建组织");
				},
				onError: (error) => {
					message.error(error.error.message || error.error.statusText);
				},
			},
		);
	};

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-6 text-center font-bold text-3xl">Create Account</h1>

			<Form
				form={form}
				onFinish={handleSubmit}
				layout="vertical"
				className="space-y-4"
			>
				<Form.Item label="Name" name="name" rules={nameRules}>
					<Input />
				</Form.Item>

				<Form.Item label="Email" name="email" rules={emailRules}>
					<Input type="email" />
				</Form.Item>

				<Form.Item label="Password" name="password" rules={passwordRules}>
					<Input.Password />
				</Form.Item>

				<Form.Item>
					<Button type="primary" htmlType="submit" className="w-full">
						Sign Up
					</Button>
				</Form.Item>
			</Form>

			<div className="mt-4 text-center">
				<Button type="link" onClick={onSwitchToSignIn}>
					Already have an account? Sign In
				</Button>
			</div>
		</div>
	);
}
