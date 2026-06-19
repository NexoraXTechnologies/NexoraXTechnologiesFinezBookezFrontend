import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
    const [theme, setTheme] = useState<string>(() => {
        return localStorage.getItem("theme") || "light";
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center h-9 w-9 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
};

export default ThemeToggle;