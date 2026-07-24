import { Edit, Plus, Settings2, Trash2 } from "lucide-react";
import type { TransactionModuleItem } from "./Types";
import { Panel, StatusPill } from "../components/Configui";
import { DataREfreshButton } from "../../../components/buttons";
import SearchInput from "../../../components/searchInput";
import Badge from "../../../components/badge";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";



const moduleColumns = [
    {
        key: "moduleCode",
        title: "Module Code",
        render: (row: TransactionModuleItem) => (
            <span className="font-mono text-xs font-semibold text-muted-foreground">
                {row.moduleCode}
            </span>
        ),
    },
    {
        key: "moduleName",
        title: "Module Name",
        render: (row: TransactionModuleItem) => (
            <span className="font-semibold text-card-foreground">{row.moduleName}</span>
        ),
    },
    {
        key: "moduleType",
        title: "Module Type",
        render: (row: TransactionModuleItem) => row.moduleType || "—",
    },
    {
        key: "description",
        title: "Description",
        render: (row: TransactionModuleItem) => row.description || "—",
    },
    {
        key: "status",
        title: "Status",
        render: (row: TransactionModuleItem) => <StatusPill status={row.status} />,
    },
];

type CustomTransactionsListProps = {
    items: TransactionModuleItem[];
    loading: boolean;
    deleteLoading: boolean;
    refreshing: boolean;
    search: string;
    onChangeSearch: (value: string) => void;
    statusFilter: string;
    onChangeStatusFilter: (value: string) => void;
    totalDocs: number;
    onRefresh: () => void;
    onCreate: () => void;
    onConfigureFields: (item: TransactionModuleItem) => void;
    onEdit: (moduleCode: string) => void;
    onDeleteClick: (e: React.MouseEvent, item: TransactionModuleItem) => void;
    // pagination
    localLimit: number;
    onChangeLimit: (limit: number) => void;
    currentPage: number;
    totalPages: number;
    pagination: any;
    setLocalOffset: (offset: number) => void;
};

const CustomTransactionsList = ({
    items,
    loading,
    deleteLoading,
    refreshing,
    search,
    onChangeSearch,
    statusFilter,
    onChangeStatusFilter,
    totalDocs,
    onRefresh,
    onCreate,
    onConfigureFields,
    onEdit,
    onDeleteClick,
    localLimit,
    onChangeLimit,
    currentPage,
    totalPages,
    pagination,
    setLocalOffset,
}: CustomTransactionsListProps) => {
    return (
        <>
            <Panel
                title="Custom Transactions"
                description="Create modules, edit module information, delete unused modules and configure fields for each module."
                right={
                    <div className="flex items-center gap-2">
                        <DataREfreshButton callBackFn={onRefresh} loading={refreshing} />

                        <button
                            type="button"
                            onClick={onCreate}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            <Plus size={17} />
                            Add Custom Transaction
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <SearchInput search={search} setSearch={onChangeSearch} />

                        <select
                            value={statusFilter}
                            onChange={(event) => onChangeStatusFilter(event.target.value)}
                            className="h-10 rounded border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <Badge count={totalDocs} text="Total Custom Transactions:" varient="primary" />
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                    <DataTable
                        columns={moduleColumns}
                        data={items}
                        loading={loading}
                        emptyMessage="No custom transactions found."
                        actions={(item: TransactionModuleItem) => (
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => onConfigureFields(item)}
                                    className="inline-flex h-9 items-center gap-2 rounded border border-border px-3 text-primary transition hover:bg-primary/10"
                                    title="Configure fields"
                                >
                                    <Settings2 size={16} />
                                    Fields
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onEdit(item.moduleCode)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary transition hover:bg-primary/10"
                                    title="Edit custom transaction"
                                >
                                    <Edit size={16} />
                                </button>

                                <button
                                    type="button"
                                    disabled={deleteLoading}
                                    onClick={(e) => onDeleteClick(e, item)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Delete custom transaction"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    />
                </div>
            </Panel>

            {totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(e: any) => onChangeLimit(Number(e.target.value))}
                    preDisabled={!pagination?.hasPrevPage && currentPage <= 1}
                    nextDisabled={!pagination?.hasNextPage && currentPage >= totalPages}
                    setLocalOffset={setLocalOffset}
                    pagination={pagination}
                />
            )}
        </>
    );
};

export default CustomTransactionsList;