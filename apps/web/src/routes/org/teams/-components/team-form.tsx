import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamFormProps {
	onSubmit: (name: string) => void;
	onCancel: () => void;
	isLoading?: boolean;
}

export function TeamForm({ onSubmit, onCancel, isLoading }: TeamFormProps) {
	const [name, setName] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (name.trim()) {
			onSubmit(name.trim());
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4 py-4">
			<div className="space-y-2">
				<Label htmlFor="team-name">Team Name</Label>
				<Input
					id="team-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="e.g. Engineering, Design, Marketing"
					required
					autoFocus
				/>
			</div>
			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isLoading}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={isLoading || !name.trim()}>
					{isLoading ? "Creating..." : "Create Team"}
				</Button>
			</div>
		</form>
	);
}
