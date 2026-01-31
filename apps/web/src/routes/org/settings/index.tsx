import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/org/settings/")({
	component: SettingsIndex,
});

function SettingsIndex() {
	return <Navigate to="/org/settings/profile" replace />;
}
