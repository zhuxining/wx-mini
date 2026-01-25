import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/(auth)/login")({
	component: RouteComponent,
	validateSearch: () => ({
		redirect: undefined as string | undefined,
	}),
});

function RouteComponent() {
	const [showSignIn, setShowSignIn] = useState(false);
	const { redirect } = Route.useSearch();

	return showSignIn ? (
		<SignInForm
			onSwitchToSignUp={() => setShowSignIn(false)}
			redirect={redirect}
		/>
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}
