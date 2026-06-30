import { Check, MonitorCog, Moon, Palette, Sun } from "lucide-react";
import { useAppearance, type ThemeMode, type ThemeName } from "../../hooks/useAppearance"; 

const palettes: {
    name: ThemeName;
    label: string;
    description: string;
    colors: string[];
}[] = [
        {
            name: "matte-navy",
            label: "Matte Navy",
            description: "Deep navy with sky accent",
            colors: ["#0f172a", "#182235", "#38bdf8"],
        },
        {
            name: "matte-graphite",
            label: "Matte Graphite",
            description: "Neutral charcoal grey",
            colors: ["#121212", "#1c1c1c", "#9ca3af"],
        },
        {
            name: "matte-emerald",
            label: "Matte Emerald",
            description: "Dark green professional",
            colors: ["#07130f", "#0d1f19", "#10b981"],
        },
        {
            name: "matte-teal",
            label: "Matte Teal",
            description: "Soft teal dashboard",
            colors: ["#071316", "#0e2227", "#14b8a6"],
        },
        {
            name: "matte-indigo",
            label: "Matte Indigo",
            description: "Indigo admin theme",
            colors: ["#111126", "#1b1b36", "#818cf8"],
        },
        {
            name: "matte-rose",
            label: "Matte Rose",
            description: "Warm rose dark theme",
            colors: ["#1a0d12", "#26131b", "#fb7185"],
        },
        {
            name: "matte-coffee",
            label: "Matte Coffee",
            description: "Brown premium theme",
            colors: ["#17100b", "#24180f", "#d97706"],
        },
        {
            name: "matte-slate",
            label: "Matte Slate",
            description: "Soft slate corporate",
            colors: ["#0f1419", "#18202a", "#64748b"],
        },
        {
            name: "matte-calendar-blue",
            label: "Calendar Blue",
            description: "Blue-grey calendar dashboard",
            colors: ["#111923", "#1f2a37", "#38a8f8"],
        },
        {
            name: "crypto-red",
            label: "Crypto Red",
            description: "Black wallet style with red accent",
            colors: ["#080808", "#101010", "#dc2626"],
        },
        {
            name: "mono-graphite",
            label: "Mono Graphite",
            description: "Minimal black and grey dashboard",
            colors: ["#050505", "#171717", "#d4d4d4"],
        },
        {
            name: "soft-black-blue",
            label: "Soft Black Blue",
            description: "Clean black with blue accent",
            colors: ["#0b0f14", "#111827", "#3b82f6"],
        },
        {
            name: "soft-black-white",
            label: "Soft Black White",
            description: "Pure black and white minimal",
            colors: ["#070707", "#111111", "#ffffff"],
        },
    ];

const modes: {
    value: ThemeMode;
    label: string;
    icon: any;
    description: string;
}[] = [
        {
            value: "light",
            label: "Light",
            icon: Sun,
            description: "Clean bright interface",
        },
        {
            value: "dark",
            label: "Dark",
            icon: Moon,
            description: "Comfortable dark interface",
        },
    ];

const Appearance = () => {
    const { mode, setMode, themeName, setThemeName } = useAppearance();
    console.log({ mode })
    return (
        <div className="min-h-full bg-background p-4 text-foreground">
            <div className="mx-auto">
                {/* Header */}
                <div className="mb-6 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <MonitorCog size={22} />
                        </div>

                        <div>
                            <h1 className="text-xl font-semibold">Appearance</h1>
                            <p className="text-sm text-muted-foreground">
                                Choose light/dark mode and select your preferred color palette.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Theme Mode */}
                <div className="mb-6 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Moon size={18} className="text-primary" />
                        <h2 className="text-base font-semibold">Theme Mode</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {modes.map((item) => {
                            const Icon = item.icon;
                            const active = mode === item.value;

                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    onClick={() => {
                                        setMode(item.value);
                                        localStorage.setItem("themeMode", item.value);
                                    }}
                                    className={`relative rounded-xl border p-4 text-left transition-all duration-200 ${active
                                        ? "border-primary bg-primary/10 text-foreground"
                                        : "border-border bg-card hover:bg-muted"
                                        }
                  `}
                                >
                                    {active && (
                                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check size={14} />
                                        </div>
                                    )}

                                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                                        <Icon size={20} />
                                    </div>

                                    <h3 className="font-semibold">{item.label}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {item.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Palette */}
                {mode == "dark" && <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Palette size={18} className="text-primary" />
                        <h2 className="text-base font-semibold">Color Palette</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {palettes.map((palette) => {
                            const active = themeName === palette.name;

                            return (
                                <button
                                    key={palette.name}
                                    type="button"
                                    onClick={() => setThemeName(palette.name)}
                                    className={`
                    relative rounded-xl border p-4 text-left transition-all duration-200
                    ${active
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-card hover:bg-muted"
                                        }
                  `}
                                >
                                    {active && (
                                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check size={14} />
                                        </div>
                                    )}

                                    <div className="mb-4 flex items-center gap-2">
                                        {palette.colors.map((color) => (
                                            <span
                                                key={color}
                                                className="h-8 w-8 rounded-full border border-border"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>

                                    <h3 className="font-semibold text-card-foreground">
                                        {palette.label}
                                    </h3>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {palette.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>}
            </div>
        </div>
    );
};

export default Appearance;