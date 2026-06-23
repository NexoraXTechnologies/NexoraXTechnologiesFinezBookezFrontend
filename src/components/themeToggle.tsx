import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const getStoredTheme = () => {
    return localStorage.getItem("themeMode") || "light";
};

const applyThemeToRoot = (theme: string) => {
    const root = document.documentElement;
    if (theme === "dark") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
    localStorage.setItem("themeMode", theme);
    window.dispatchEvent(
        new CustomEvent("themeModeChange", {
            detail: theme,
        })
    );
};

const ThemeToggle = () => {
    const [theme, setTheme] = useState<string>(() => getStoredTheme());

    useEffect(() => {
        applyThemeToRoot(theme);
    }, [theme]);

    useEffect(() => {
        const syncTheme = () => {
            const storedTheme = getStoredTheme();
            setTheme(storedTheme);
        };
        window.addEventListener("storage", syncTheme);
        window.addEventListener("themeModeChange", syncTheme as EventListener);
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains("dark");
            const currentTheme = isDark ? "dark" : "light";

            if (currentTheme !== getStoredTheme()) {
                localStorage.setItem("themeMode", currentTheme);
            }

            setTheme(currentTheme);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            window.removeEventListener("storage", syncTheme);
            window.removeEventListener("themeModeChange", syncTheme as EventListener);
            observer.disconnect();
        };
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="
                flex h-9 w-9 cursor-pointer items-center justify-center rounded-full
                border border-border bg-card text-card-foreground
                transition hover:bg-muted hover:text-primary
            "
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
};

export default ThemeToggle;