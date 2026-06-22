import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

export type ThemeName =
    | "green"
    | "purple"
    | "blue"
    | "black"
    | "grey"
    | "plantify"
    | "matte-navy"
    | "matte-graphite"
    | "matte-emerald"
    | "matte-teal"
    | "matte-indigo"
    | "matte-rose"
    | "matte-coffee"
    | "matte-slate"
    | "matte-calendar-blue"
    | "crypto-red"
    | "mono-graphite"
    | "soft-black-blue"
    | "soft-black-white";

const DEFAULT_MODE: ThemeMode = "dark";
const DEFAULT_THEME: ThemeName = "plantify";

const isValidMode = (value: string | null): value is ThemeMode => {
    return value === "light" || value === "dark";
};

const isValidTheme = (value: string | null): value is ThemeName => {
    return (
        value === "green" ||
        value === "purple" ||
        value === "blue" ||
        value === "black" ||
        value === "grey" ||
        value === "plantify" ||
        value === "matte-navy" ||
        value === "matte-graphite" ||
        value === "matte-emerald" ||
        value === "matte-teal" ||
        value === "matte-indigo" ||
        value === "matte-rose" ||
        value === "matte-coffee" ||
        value === "matte-slate" ||
        value === "matte-calendar-blue" ||
        value === "crypto-red" ||
        value === "mono-graphite" ||
        value === "soft-black-blue" ||
        value === "soft-black-white"
    );
};

export const useAppearance = () => {
    const [mode, setMode] = useState<ThemeMode>(() => {
        const savedMode = localStorage.getItem("themeMode");
        return isValidMode(savedMode) ? savedMode : DEFAULT_MODE;
    });

    const [themeName, setThemeName] = useState<ThemeName>(() => {
        const savedTheme = localStorage.getItem("themeName");
        return isValidTheme(savedTheme) ? savedTheme : DEFAULT_THEME;
    });

    useEffect(() => {
        const root = document.documentElement;

        root.classList.remove("light", "dark");
        root.classList.add(mode);

        root.setAttribute("data-theme", themeName);

        localStorage.setItem("themeMode", mode);
        localStorage.setItem("themeName", themeName);
    }, [mode, themeName]);

    return {
        mode,
        setMode,
        themeName,
        setThemeName,
    };
};