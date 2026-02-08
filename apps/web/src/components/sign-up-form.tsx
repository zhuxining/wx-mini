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
		<div style={{ maxWidth: 400, margin: "40px auto", padding: 24 }}>
			<h1
				style={{
					textAlign: "center",
					marginBottom: 24,
					fontWeight: "bold",
					fontSize: 28,
				}}
			>
				Create Account
			</h1>

			<Form form={form} onFinish={handleSubmit} layout="vertical">
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
					<Button type="primary" htmlType="submit" block>
						Sign Up
					</Button>
				</Form.Item>
			</Form>

			<div style={{ marginTop: 16, textAlign: "center" }}>
				<Button type="link" onClick={onSwitchToSignIn}>
					Already have an account? Sign In
				</Button>
			</div>
		</div>
	);
}
