

import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ArrowLeft, Boxes, ShieldCheck } from "lucide-react";

import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import { clearTransactionSchemaState } from "../../../redux/slices/professionalSlice/transactionSchema";
import type { SchemaContext, SidebarTab, TransactionItem, TransactionModuleItem } from "./Types";
import { useTransactionModules } from "./Usetransactionmodules";
import { TRANSACTIONS } from "./Constants";
import { useTransactionSchema } from "./Usetransactionschema";
import TransactionOverview from "./Transactionoverview";
import CustomTransactionsList from "./Customtransactionslist";
import SchemaBuilderPanel from "./Schemabuilderpanel";
import TransactionSidebar from "./Transactionsidebar";
import ModuleFormModal from "./Moduleformmodal";
import SchemaFieldFormModal from "./Schemafieldformmodal";

const TransactionConfiguration = () => {
    const dispatch = useDispatch<any>();

    const [activeTab, setActiveTab] = useState<string>("overview");
    const [selectedCustomModule, setSelectedCustomModule] =
        useState<TransactionModuleItem | null>(null);

    const modules = useTransactionModules();

    const selectedTransaction = useMemo<TransactionItem | null>(
        () => TRANSACTIONS.find((t) => t.key === activeTab) || null,
        [activeTab]
    );

    const schemaContext = useMemo<SchemaContext | null>(() => {
        if (activeTab === "customTransactionSchema" && selectedCustomModule) {
            return {
                moduleKey: selectedCustomModule.moduleCode,
                title: selectedCustomModule.moduleName,
                kind: "custom",
            };
        }

        if (selectedTransaction) {
            return {
                moduleKey: selectedTransaction.key,
                title: selectedTransaction.name,
                kind: "transaction",
            };
        }

        return null;
    }, [activeTab, selectedCustomModule, selectedTransaction]);

    const schema = useTransactionSchema(schemaContext);

    /* ---------------------------------------------------
       Navigation helpers
    --------------------------------------------------- */

    const openCustomModuleSchema = (item: TransactionModuleItem) => {
        setSelectedCustomModule(item);
        setActiveTab("customTransactionSchema");
        schema.setSchemaSearch("");
    };

    const goToCustomTransactionsList = () => {
        setActiveTab("customTransactions");
        setSelectedCustomModule(null);
        dispatch(clearTransactionSchemaState());
    };

    const tabs: SidebarTab[] = useMemo(
        () => [
            { key: "overview", label: "All Transactions", icon: <Boxes size={17} /> },
            ...TRANSACTIONS.map((t) => ({ key: t.key, label: t.name, icon: t.icon })),
            ...modules.transactionModules.map((item: TransactionModuleItem) => ({
                key: `custom-${item.moduleCode}`,
                label: item.moduleName,
                icon: <ShieldCheck size={17} />,
                module: item,
            })),
            {
                key: "customTransactions",
                label: "Custom Transactions",
                icon: <ShieldCheck size={17} />,
            },
        ],
        [modules.transactionModules]
    );

    const handleSelectTab = (tab: SidebarTab) => {
        if (tab.key.startsWith("custom-") && tab.module) {
            openCustomModuleSchema(tab.module);
            return;
        }

        setActiveTab(tab.key);

        if (tab.key !== "customTransactions") {
            setSelectedCustomModule(null);
            dispatch(clearTransactionSchemaState());
        }
    };

    /* ---------------------------------------------------
       Content router
    --------------------------------------------------- */

    const renderActiveContent = () => {
        if (activeTab === "overview") {
            return (
                <TransactionOverview
                    transactionModules={modules.transactionModules}
                    totalCustomDocs={modules.totalDocs}
                    onSelectFixedTransaction={(t) => setActiveTab(t.key)}
                    onSelectCustomModule={openCustomModuleSchema}
                    onViewCustomTransactions={() => setActiveTab("customTransactions")}
                    onCreateCustomTransaction={modules.openCreateModuleForm}
                />
            );
        }

        if (activeTab === "customTransactions") {
            return (
                <CustomTransactionsList
                    items={modules.transactionModules}
                    loading={modules.moduleLoading}
                    deleteLoading={modules.deleteLoading}
                    refreshing={modules.refreshing}
                    search={modules.search}
                    onChangeSearch={modules.setSearch}
                    statusFilter={modules.statusFilter}
                    onChangeStatusFilter={modules.setStatusFilter}
                    totalDocs={modules.totalDocs}
                    onRefresh={modules.handleRefreshModules}
                    onCreate={modules.openCreateModuleForm}
                    onConfigureFields={openCustomModuleSchema}
                    onEdit={modules.openEditModuleForm}
                    onDeleteClick={modules.handleDeleteClick}
                    localLimit={modules.localLimit}
                    onChangeLimit={modules.setLocalLimit}
                    currentPage={modules.currentPage}
                    totalPages={modules.totalPages}
                    pagination={modules.pagination}
                    setLocalOffset={modules.setLocalOffset}
                />
            );
        }

        if (activeTab === "customTransactionSchema" && selectedCustomModule) {
            return (
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={goToCustomTransactionsList}
                        className="inline-flex h-9 items-center gap-2 rounded border border-border bg-card px-3 text-sm font-semibold text-card-foreground transition hover:bg-muted"
                    >
                        <ArrowLeft size={16} />
                        Back to Custom Transactions
                    </button>

                    <SchemaBuilderPanel
                        title={`${selectedCustomModule.moduleName} Schema`}
                        description={`Configure fields for ${selectedCustomModule.moduleName}.`}
                        badgeText={selectedCustomModule.moduleCode}
                        schemaData={schema.schemaData}
                        schemaSection={schema.schemaSection}
                        onChangeSchemaSection={schema.setSchemaSection}
                        fields={schema.filteredSchemaFields}
                        totalFieldCount={schema.sectionCounts.total}
                        schemaSearch={schema.schemaSearch}
                        onChangeSchemaSearch={schema.setSchemaSearch}
                        schemaLoading={schema.schemaLoading}
                        schemaRefreshing={schema.schemaRefreshing}
                        onRefresh={schema.handleRefreshSchema}
                        onAddField={schema.openAddSchemaForm}
                        onEditField={schema.openEditSchemaForm}
                    />
                </div>
            );
        }

        if (selectedTransaction) {
            return (
                <SchemaBuilderPanel
                    title={`${selectedTransaction.name} Schema`}
                    description={selectedTransaction.description}
                    badgeText="Transaction"
                    schemaData={schema.schemaData}
                    schemaSection={schema.schemaSection}
                    onChangeSchemaSection={schema.setSchemaSection}
                    fields={schema.filteredSchemaFields}
                    totalFieldCount={schema.sectionCounts.total}
                    schemaSearch={schema.schemaSearch}
                    onChangeSchemaSearch={schema.setSchemaSearch}
                    schemaLoading={schema.schemaLoading}
                    schemaRefreshing={schema.schemaRefreshing}
                    onRefresh={schema.handleRefreshSchema}
                    onAddField={schema.openAddSchemaForm}
                    onEditField={schema.openEditSchemaForm}
                />
            );
        }

        return (
            <TransactionOverview
                transactionModules={modules.transactionModules}
                totalCustomDocs={modules.totalDocs}
                onSelectFixedTransaction={(t) => setActiveTab(t.key)}
                onSelectCustomModule={openCustomModuleSchema}
                onViewCustomTransactions={() => setActiveTab("customTransactions")}
                onCreateCustomTransaction={modules.openCreateModuleForm}
            />
        );
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-4">
            <div className="space-y-4">
                <header className="flex flex-col gap-3 rounded border border-border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex h-9 w-9 items-center justify-center rounded border border-border bg-background text-card-foreground transition hover:bg-muted"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div>
                            <h1 className="text-xl font-semibold text-card-foreground">
                                Transactions Configuration
                            </h1>
                            <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                Configure fixed-transaction fields and manage custom-transaction
                                modules with their own schemas.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {TRANSACTIONS.length} Transactions
                        </span>
                        <span className="rounded-md bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {modules.totalDocs} Custom Transactions
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                    <TransactionSidebar
                        tabs={tabs}
                        activeTab={activeTab}
                        selectedCustomModule={selectedCustomModule}
                        onSelectTab={handleSelectTab}
                    />

                    <main className="min-w-0 space-y-4">{renderActiveContent()}</main>
                </div>
            </div>

            <ModuleFormModal
                open={modules.showModuleForm}
                editingModuleCode={modules.editingModuleCode}
                loadingExisting={modules.moduleLoading}
                form={modules.moduleForm}
                errors={modules.moduleFormErrors}
                submitting={modules.isModuleSubmitting}
                serverError={modules.moduleError}
                onChangeField={modules.updateModuleFormField}
                onSubmit={modules.handleModuleSubmit}
                onClose={modules.closeModuleForm}
            />

            <SchemaFieldFormModal
                open={schema.showSchemaForm}
                schemaContext={schemaContext}
                editingSchemaFieldKey={schema.editingSchemaFieldKey}
                form={schema.schemaForm}
                errors={schema.schemaFormErrors}
                submitting={schema.isSchemaSubmitting}
                onChangeField={schema.updateSchemaFormField}
                onSubmit={schema.handleSchemaSubmit}
                onClose={schema.closeSchemaForm}
            />

            {modules.confirmTooltip.show && (
                <ConfirmTooltip
                    x={modules.confirmTooltip.x}
                    y={modules.confirmTooltip.y}
                    message={`Are you sure you want to delete ${modules.confirmTooltip?.item?.moduleName || "this custom transaction"
                        } (${modules.confirmTooltip?.moduleCode || ""})?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={() =>
                        modules.handleDeleteConfirm((deletedModuleCode) => {
                            if (selectedCustomModule?.moduleCode === deletedModuleCode) {
                                setSelectedCustomModule(null);
                                dispatch(clearTransactionSchemaState());
                                setActiveTab("customTransactions");
                            }
                        })
                    }
                    onCancel={modules.closeConfirmTooltip}
                />
            )}
        </div>
    );
};

export default TransactionConfiguration;