import { Button } from "antd";
import { Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useAntdTheme } from "./antd-theme-provider";

const MODE_ICONS = {
	light: <Sun size={14} />,
	dark: <Moon size={14} />,
	system: <Laptop size={14} />,
};

const MODE_LABELS: Record<string, string> = {
	light: "亮色",
	dark: "暗色",
	system: "跟随系统",
};

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { mode, toggleMode } = useAntdTheme();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<Button
			type="text"
			icon={MODE_ICONS[mode]}
			onClick={toggleMode}
			title={MODE_LABELS[mode]}
		/>
	);
}
