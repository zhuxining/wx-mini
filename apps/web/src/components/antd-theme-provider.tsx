import { theme as antdTheme, ConfigProvider } from "antd";
import { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
	mode: ThemeMode;
	actualMode: "light" | "dark";
	setMode: (mode: ThemeMode) => void;
	toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "antd-theme-mode";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
}

function getStoredTheme(): ThemeMode {
	if (typeof window === "undefined") return "system";
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === "light" || stored === "dark" || stored === "system"
			? stored
			: "system";
	} catch {
		return "system";
	}
}

function setStoredTheme(mode: ThemeMode) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, mode);
	} catch {
		// Ignore storage errors
	}
}

function getActualMode(mode: ThemeMode): "light" | "dark" {
	return mode === "system" ? getSystemTheme() : mode;
}

/**
 * Antd 主题提供者 - 完全使用 antd 管理主题
 * 支持 light/dark/system 三种模式
 */
export function AntdThemeProvider({ children }: { children: React.ReactNode }) {
	const [mode, setModeState] = useState<ThemeMode>(getStoredTheme);
	const [actualMode, setActualMode] = useState<"light" | "dark">(() =>
		getActualMode(getStoredTheme()),
	);
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	// 监听系统主题变化
	useEffect(() => {
		if (!isClient || mode !== "system") return;

		const mediaQuery = window.matchMedia(MEDIA_QUERY);

		const handleChange = (e: MediaQueryListEvent) => {
			setActualMode(e.matches ? "dark" : "light");
		};

		// 现代浏览器
		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [isClient, mode]);

	// 同步主题到 DOM
	useEffect(() => {
		if (!isClient) return;
		const root = document.documentElement;
		if (actualMode === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
	}, [actualMode, isClient]);

	const setMode = (newMode: ThemeMode) => {
		setModeState(newMode);
		setStoredTheme(newMode);
		setActualMode(getActualMode(newMode));
	};

	const toggleMode = () => {
		const modes: ThemeMode[] = ["light", "dark", "system"];
		const currentIndex = modes.indexOf(mode);
		const nextMode = modes[(currentIndex + 1) % modes.length];
		setMode(nextMode);
	};

	return (
		<ThemeContext.Provider value={{ mode, actualMode, setMode, toggleMode }}>
			<ConfigProvider
				theme={{
					algorithm:
						actualMode === "dark"
							? antdTheme.darkAlgorithm
							: antdTheme.defaultAlgorithm,
				}}
			>
				{children}
			</ConfigProvider>
		</ThemeContext.Provider>
	);
}

/**
 * 使用主题 Hook
 */
export function useAntdTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useAntdTheme must be used within AntdThemeProvider");
	}
	return context;
}
