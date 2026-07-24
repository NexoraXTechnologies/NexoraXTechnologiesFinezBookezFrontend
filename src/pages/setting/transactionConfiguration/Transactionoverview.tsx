import { Plus, ShieldCheck } from "lucide-react";
import type { TransactionItem, TransactionModuleItem } from "./Types";
import { Panel } from "../components/Configui";
import { TRANSACTIONS } from "./Constants";



type TileButtonProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
};

/** One clickable tile — shared shape for fixed transactions and custom modules. */
const TileButton = ({ icon, title, description, onClick }: TileButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-start gap-4 rounded border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
    >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
            {icon}
        </span>
        <span className="min-w-0">
            <span className="block text-sm font-semibold text-card-foreground">{title}</span>
            <span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">
                {description}
            </span>
        </span>
    </button>
);

type TransactionOverviewProps = {
    transactionModules: TransactionModuleItem[];
    totalCustomDocs: number;
    onSelectFixedTransaction: (transaction: TransactionItem) => void;
    onSelectCustomModule: (item: TransactionModuleItem) => void;
    onViewCustomTransactions: () => void;
    onCreateCustomTransaction: () => void;
};

const TransactionOverview = ({
    transactionModules,
    totalCustomDocs,
    onSelectFixedTransaction,
    onSelectCustomModule,
    onViewCustomTransactions,
    onCreateCustomTransaction,
}: TransactionOverviewProps) => {
    return (
        <div className="space-y-4">
            <Panel
                title="Transactions Configuration"
                description="Configure fields for every fixed transaction type, plus any custom transaction modules you've created."
            >
                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                    {TRANSACTIONS.map((t) => (
                        <TileButton
                            key={t.key}
                            icon={t.icon}
                            title={t.name}
                            description={t.description}
                            onClick={() => onSelectFixedTransaction(t)}
                        />
                    ))}

                    {transactionModules.map((item) => (
                        <TileButton
                            key={item.moduleCode}
                            icon={<ShieldCheck size={20} />}
                            title={item.moduleName}
                            description={item.description || `Configure ${item.moduleName} fields`}
                            onClick={() => onSelectCustomModule(item)}
                        />
                    ))}
                </div>
            </Panel>

            <Panel
                title="Custom Transactions"
                description="Create business-specific transaction modules and configure a separate schema for each one."
                right={
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {totalCustomDocs} Created
                    </span>
                }
            >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium leading-5 text-muted-foreground">
                        Examples include Delivery Challan, Debit Note, Credit Note and other
                        business-specific transaction types.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={onViewCustomTransactions}
                            className="h-10 rounded border border-border bg-background px-4 text-sm font-semibold text-card-foreground transition hover:bg-muted"
                        >
                            View Custom Transactions
                        </button>

                        <button
                            type="button"
                            onClick={onCreateCustomTransaction}
                            className="inline-flex h-10 items-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            <Plus size={17} />
                            Add Custom Transaction
                        </button>
                    </div>
                </div>
            </Panel>
        </div>
    );
};

export default TransactionOverview;