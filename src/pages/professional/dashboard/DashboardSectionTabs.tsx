type DashboardSection = "dashboard" | "analytics" | "custom";
type DashboardSectionTabsProps = {
    activeSection: DashboardSection;
    onChange: (section: DashboardSection) => void;
};
const DashboardSectionTabs = ({ activeSection, onChange, }: DashboardSectionTabsProps) => {
    return (
        <div className="mb-5 inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
            <button
                type="button"
                onClick={() => onChange("dashboard")}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition ${activeSection === "dashboard"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
            >
                BookEZ
            </button>
            <button
                type="button"
                onClick={() => onChange("analytics")}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition ${activeSection === "analytics"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
            >
                TransportEZ
            </button>
            <button
                type="button"
                onClick={() => onChange("custom")}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-bold transition ${activeSection === "custom"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
            >
                Custom Dashboard
            </button>
        </div>
    );
};
export default DashboardSectionTabs;
