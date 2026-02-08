import { useNavigate } from "@tanstack/react-router";
import { App, Button, Form, Input } from "antd";
import type { Rule } from "antd/es/form";
import { authClient } from "@/lib/auth-client";

interface SignInFormValues {
	email: string;
	password: string;
}

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const navigate = useNavigate({ from: "/" });
	const { message } = App.useApp();
	const [form] = Form.useForm<SignInFormValues>();

	const emailRules: Rule[] = [
		{ required: true, message: "Please input your email" },
		{ type: "email", message: "Invalid email address" },
	];

	const passwordRules: Rule[] = [
		{ required: true, message: "Please input your password" },
		{ min: 8, message: "Password must be at least 8 characters" },
	];

	const handleSubmit = async (values: SignInFormValues) => {
		await authClient.signIn.email(
			{ email: values.email, password: values.password },
			{
				onSuccess: () => {
					navigate({ to: "/" });
					message.success("Sign in successful");
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
				Welcome Back
			</h1>

			<Form form={form} onFinish={handleSubmit} layout="vertical">
				<Form.Item label="Email" name="email" rules={emailRules}>
					<Input type="email" />
				</Form.Item>

				<Form.Item label="Password" name="password" rules={passwordRules}>
					<Input.Password />
				</Form.Item>

				<Form.Item>
					<Button type="primary" htmlType="submit" block>
						Sign In
					</Button>
				</Form.Item>
			</Form>

			<div style={{ marginTop: 16, textAlign: "center" }}>
				<Button type="link" onClick={onSwitchToSignUp}>
					Need an account? Sign Up
				</Button>
			</div>
		</div>
	);
}
