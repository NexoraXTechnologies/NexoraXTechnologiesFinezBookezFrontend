import type { SidebarTab, TransactionModuleItem } from "./Types";

type TransactionSidebarProps = {
    tabs: SidebarTab[];
    activeTab: string;
    selectedCustomModule: TransactionModuleItem | null;
    onSelectTab: (tab: SidebarTab) => void;
};

/**
 * Generic sidebar menu. Doesn't know anything about how tabs were built —
 * the parent decides what goes in `tabs` (fixed transactions, the two
 * static tabs, and/or one entry per custom module).
 */
const TransactionSidebar = ({
    tabs,
    activeTab,
    selectedCustomModule,
    onSelectTab,
}: TransactionSidebarProps) => {
    return (
        <aside className="max-h-max rounded border border-border bg-card p-2 shadow-sm lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <div className="mb-2 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Transaction Menu
                </p>
            </div>

            <div className="space-y-1">
                {tabs.map((tab) => {
                    const isCustomTab = tab.key.startsWith("custom-");

                    const isActive = isCustomTab
                        ? activeTab === "customTransactionSchema" &&
                          selectedCustomModule?.moduleCode === tab.module?.moduleCode
                        : activeTab === tab.key ||
                          (tab.key === "customTransactions" &&
                              activeTab === "customTransactionSchema" &&
                              !selectedCustomModule);

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onSelectTab(tab)}
                            className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-bold transition ${
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
                            }`}
                        >
                            <span
                                className={`flex h-8 w-8 items-center justify-center rounded ${
                                    isActive ? "bg-white/15" : "bg-background text-primary"
                                }`}
                            >
                                {tab.icon}
                            </span>
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default TransactionSidebar;