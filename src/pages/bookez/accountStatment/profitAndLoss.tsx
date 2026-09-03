import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, LoaderCircle, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../../components/DataTable";
import ReportFilterCard from "../reports/components/ReportFilterCard";
import { clearProfitLossState, getProfitLossAnalysis, getProfitLossFilterOptions } from "../../../redux/slices/professionalSlice/accountStatment/profitAndLoss";
import { getFirstDateOfCurrentMonth, todayYMD } from "../../../utils/helperFunctions";

type ProfitLossProps = { show?: boolean; };

const formatAmount = (value: any) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatFromDate = (date: string) => {
    if (!date) return "";
    return new Date(`${date}T00:00:00.000+05:30`).toISOString();
};

const formatToDate = (date: string) => {
    if (!date) return "";
    return new Date(`${date}T23:59:59.999+05:30`).toISOString();
};

const incomeColumns = [
    {
        key: "particular",
        title: "Particular",
        render: (row: any) => <span className="text-sm font-medium text-card-foreground">{row?.particular || "-"}</span>
    },
    {
        key: "amount",
        title: "Amount",
        render: (row: any) => <span className="text-sm font-semibold text-success">₹{formatAmount(row?.amount)}</span>
    }
];

const expenseColumns = [
    {
        key: "particular",
        title: "Particular",
        render: (row: any) => <span className="text-sm font-medium text-card-foreground">{row?.particular || "-"}</span>
    },
    {
        key: "amount",
        title: "Amount",
        render: (row: any) => <span className="text-sm font-semibold text-danger">₹{formatAmount(row?.amount)}</span>
    }
];

const ProfitAndLoss = ({ show = true }: ProfitLossProps) => {
    const dispatch = useDispatch<any>();

    const profitLossState = useSelector((state: any) =>
        state?.profitLoss ||
        state?.profitAndLoss ||
        state?.accountStatement?.profitLoss ||
        state?.accountStatment?.profitLoss ||
        {}
    );

    const {
        filterOptions = null,
        analysis = null,
        filterOptionsLoading = false,
        analysisLoading = false
    } = profitLossState;

    const [fromDate, setFromDate] = useState<string>(getFirstDateOfCurrentMonth());
    const [toDate, setToDate] = useState<string>(todayYMD());
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [customMasterValues, setCustomMasterValues] = useState<Record<string, string>>({});
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    // FILTER OPTIONS
    const customMasterModules = useMemo(() => {
        let filters: any[] = [];

        if (Array.isArray(filterOptions)) {
            filters = filterOptions;
        } else if (Array.isArray(filterOptions?.filters)) {
            filters = filterOptions.filters;
        } else if (Array.isArray(filterOptions?.data?.filters)) {
            filters = filterOptions.data.filters;
        } else if (Array.isArray(filterOptions?.data?.data?.filters)) {
            filters = filterOptions.data.data.filters;
        } else if (Array.isArray(filterOptions?.payload?.filters)) {
            filters = filterOptions.payload.filters;
        }

        return filters
            .map((filter: any) => ({
                moduleCode: String(filter?.moduleCode || "").trim(),
                moduleName: String(filter?.moduleName || "").trim(),
                description: String(filter?.description || "").trim(),
                totalEntries: Number(filter?.totalEntries || 0),
                options: Array.isArray(filter?.entries)
                    ? filter.entries
                        .map((entry: any) => ({
                            label: String(entry?.name || entry?.code || "").trim(),
                            value: String(entry?.code || "").trim()
                        }))
                        .filter((entry: any) => entry.label && entry.value)
                    : []
            }))
            .filter((filter: any) => filter.moduleName);
    }, [filterOptions]);

    // SELECTED CUSTOM MASTER FILTERS
    const customMasterFilters = useMemo(() => {
        return customMasterModules
            .map((module: any) => {
                const code = String(customMasterValues[module.moduleName] || "").trim();

                if (!code) return null;

                return {
                    moduleName: module.moduleName,
                    code
                };
            })
            .filter(Boolean);
    }, [customMasterModules, customMasterValues]);

    // ANALYSIS RESPONSE
    const incomeRows = useMemo(() => Array.isArray(analysis?.data?.incomeRows) ? analysis.data.incomeRows : [], [analysis]);
    const expenseRows = useMemo(() => Array.isArray(analysis?.data?.expenseRows) ? analysis.data.expenseRows : [], [analysis]);
    // const otherIncomeDetails = useMemo(() => Array.isArray(analysis?.data?.otherIncomeDetails) ? analysis.data.otherIncomeDetails : [], [analysis]);
    // const otherExpenseDetails = useMemo(() => Array.isArray(analysis?.data?.otherExpenseDetails) ? analysis.data.otherExpenseDetails : [], [analysis]);
    const totalIncome = Number(analysis?.data?.totalIncome || 0);
    const totalExpense = Number(analysis?.data?.totalExpense || 0);
    const netProfit = Number(analysis?.data?.netProfit || 0);
    const pageLoading = filterOptionsLoading || analysisLoading;

    const buildPayload = (exportType: "" | "pdf" | "excel" = "") => {
        const payload: any = {
            fromDate: formatFromDate(fromDate),
            toDate: formatToDate(toDate)
        };

        if (exportType) payload.exportType = exportType;
        if (customMasterFilters.length) payload.customMasterFilters = customMasterFilters;

        return payload;
    };

    const resetProfitLoss = () => {
        setFromDate(getFirstDateOfCurrentMonth());
        setToDate(todayYMD());
        setCustomMasterValues({});
        dispatch(clearProfitLossState());
    };

    // LOAD FILTER OPTIONS
    useEffect(() => {
        if (!fromDate || !toDate) return;

        dispatch(getProfitLossFilterOptions({
            fromDate: formatFromDate(fromDate),
            toDate: formatToDate(toDate),
            exportType: ""
        }) as any);
    }, [dispatch, fromDate, toDate]);

    // LOAD ANALYSIS
    useEffect(() => {
        if (!fromDate || !toDate) return;

        const payload: any = {
            fromDate: formatFromDate(fromDate),
            toDate: formatToDate(toDate)
        };

        if (customMasterFilters.length) payload.customMasterFilters = customMasterFilters;

        dispatch(getProfitLossAnalysis(payload) as any);
    }, [dispatch, fromDate, toDate, customMasterFilters]);

    // REMOVE SELECTED VALUE IF MODULE IS REMOVED FROM API
    useEffect(() => {
        if (!customMasterModules.length) return;

        setCustomMasterValues((previous) => {
            const validModuleNames = new Set(customMasterModules.map((module: any) => module.moduleName));
            const next: Record<string, string> = {};

            Object.entries(previous).forEach(([moduleName, code]) => {
                if (validModuleNames.has(moduleName)) next[moduleName] = code;
            });

            return next;
        });
    }, [customMasterModules]);

    useEffect(() => {
        if (!show) resetProfitLoss();
    }, [show]);

    useEffect(() => () => {
        dispatch(clearProfitLossState());
    }, [dispatch]);

    const downloadBlobFile = (blob: Blob, fileName: string) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = async () => {
        if (pdfLoading) return;

        try {
            setPdfLoading(true);

            const res = await dispatch(getProfitLossAnalysis(buildPayload("pdf")) as any).unwrap();

            if (res?.blob instanceof Blob) {
                downloadBlobFile(res.blob, "profit-loss.pdf");
            }
        } catch (error) {
            console.log("Profit & Loss PDF download failed", error);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleDownloadExcel = async () => {
        if (excelLoading) return;

        try {
            setExcelLoading(true);

            const res = await dispatch(getProfitLossAnalysis(buildPayload("excel")) as any).unwrap();

            if (res?.blob instanceof Blob) {
                downloadBlobFile(res.blob, "profit-loss.xlsx");
            }
        } catch (error) {
            console.log("Profit & Loss Excel download failed", error);
        } finally {
            setExcelLoading(false);
        }
    };

    // FILTER FIELDS
    const filterFields: any[] = [
        {
            key: "fromDate",
            type: "date",
            label: "From Date",
            value: fromDate,
            onChange: (value: string) => setFromDate(value),
            required: true
        },
        {
            key: "toDate",
            type: "date",
            label: "To Date",
            value: toDate,
            onChange: (value: string) => setToDate(value),
            required: true
        },

        ...customMasterModules.map((module: any) => ({
            key: `profitLoss_${module.moduleCode || module.moduleName}`,
            type: "select",
            label: module.moduleName,
            placeholder: module.options.length ? `All ${module.moduleName}` : `No ${module.moduleName} available`,
            value: customMasterValues[module.moduleName] || "",
            options: module.options,
            disabled: filterOptionsLoading,
            required: false,
            onChange: (value: string) => {
                setCustomMasterValues((previous) => ({
                    ...previous,
                    [module.moduleName]: value
                }));
            }
        }))
    ];

    return (
        <div className="relative flex h-full w-full flex-col gap-3 bg-background p-3 text-foreground">
            <AnimatePresence>
                {pageLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-[1px]"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 shadow-lg"
                        >
                            <LoaderCircle size={19} className="animate-spin text-primary" />

                            <div>
                                <p className="text-xs font-semibold text-card-foreground">Loading Profit & Loss</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {filterOptionsLoading ? "Loading filter options..." : "Preparing report data..."}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full">
                <button
                    type="button"
                    onClick={() => setFiltersOpen((previous) => !previous)}
                    className="mb-1 flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left shadow-sm transition-colors duration-200 hover:bg-muted/40"
                >
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <BarChart3 size={15} />
                        </div>

                        <div>
                            <p className="text-sm font-semibold leading-tight text-card-foreground">Profit & Loss Filters</p>
                            <p className="text-[11px] leading-tight text-muted-foreground">Date range and master filters</p>
                        </div>
                    </div>

                    <motion.span
                        animate={{ rotate: filtersOpen ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                    >
                        <ChevronDown size={17} />
                    </motion.span>
                </button>

                <AnimatePresence initial={false}>
                    {filtersOpen && (
                        <motion.div
                            key="profit-loss-filters"
                            initial={{ height: 0, opacity: 0, y: -5 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -5 }}
                            transition={{ height: { duration: 0.3, ease: "easeInOut" }, opacity: { duration: 0.2 }, y: { duration: 0.25, ease: "easeOut" } }}
                            className="overflow-hidden"
                        >
                            <div className="mt-1 w-full [&>*]:rounded-lg [&>*]:!border-border [&>*]:!p-3 [&>*]:shadow-sm [&_h3]:!hidden [&_h2]:!hidden [&_p]:!text-xs [&_label]:!text-xs [&_input]:!h-9 [&_input]:!text-sm [&_select]:!h-9 [&_select]:!text-sm">
                                <ReportFilterCard
                                    title=""
                                    fields={filterFields}
                                    gridCols="4"
                                    onDownloadPdf={handleDownloadPdf}
                                    onDownloadExcel={handleDownloadExcel}
                                    pdfDisabled={pdfLoading || analysisLoading}
                                    excelDisabled={excelLoading || analysisLoading}
                                    pdfLoading={pdfLoading}
                                    excelLoading={excelLoading}
                                    downloadDisabledMessage="Please wait while Profit & Loss is loading."
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <div className="rounded-lg border border-success/20 bg-card px-3 py-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Income</p>
                            <p className="mt-0.5 truncate text-lg font-bold leading-tight text-success">₹{formatAmount(totalIncome)}</p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                            <TrendingUp size={17} />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border border-danger/20 bg-card px-3 py-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Expenses</p>
                            <p className="mt-0.5 truncate text-lg font-bold leading-tight text-danger">₹{formatAmount(totalExpense)}</p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
                            <TrendingDown size={17} />
                        </div>
                    </div>
                </div>

                <div className={`rounded-lg border bg-card px-3 py-2.5 shadow-sm ${netProfit >= 0 ? "border-success/20" : "border-danger/20"}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{netProfit >= 0 ? "Net Profit" : "Net Loss"}</p>
                            <p className={`mt-0.5 truncate text-lg font-bold leading-tight ${netProfit >= 0 ? "text-success" : "text-danger"}`}>
                                ₹{formatAmount(Math.abs(netProfit))}
                            </p>
                        </div>

                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${netProfit >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                            <WalletCards size={17} />
                        </div>
                    </div>
                </div>
            </div> */}

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border bg-success/[0.03] px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-success/10 text-success">
                                <TrendingUp size={15} />
                            </div>

                            <div>
                                <p className="text-sm font-semibold leading-tight text-card-foreground">Income</p>
                                <p className="text-[11px] leading-tight text-muted-foreground">{incomeRows.length} {incomeRows.length === 1 ? "entry" : "entries"}</p>
                            </div>
                        </div>

                        <span className="rounded-md bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                            ₹{formatAmount(totalIncome)}
                        </span>
                    </div>

                    <div className="min-w-0 overflow-hidden [&_table]:!w-full [&_table]:!min-w-full [&_.overflow-x-auto]:!overflow-x-hidden [&_th]:!py-2 [&_th]:!text-xs [&_td]:!py-2 [&_td]:!text-sm">
                        <DataTable
                            columns={incomeColumns}
                            data={incomeRows}
                            loading={analysisLoading}
                            emptyMessage="No income data found"
                            showFieldSelector={false}
                        />
                    </div>
                </div>

                <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border bg-danger/[0.03] px-3 py-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-danger/10 text-danger">
                                <TrendingDown size={15} />
                            </div>

                            <div>
                                <p className="text-sm font-semibold leading-tight text-card-foreground">Expenses</p>
                                <p className="text-[11px] leading-tight text-muted-foreground">{expenseRows.length} {expenseRows.length === 1 ? "entry" : "entries"}</p>
                            </div>
                        </div>

                        <span className="rounded-md bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger">
                            ₹{formatAmount(totalExpense)}
                        </span>
                    </div>

                    <div className="min-w-0 overflow-hidden [&_table]:!w-full [&_table]:!min-w-full [&_.overflow-x-auto]:!overflow-x-hidden [&_th]:!py-2 [&_th]:!text-xs [&_td]:!py-2 [&_td]:!text-sm">
                        <DataTable
                            columns={expenseColumns}
                            data={expenseRows}
                            loading={analysisLoading}
                            emptyMessage="No expense data found"
                            showFieldSelector={false}
                        />
                    </div>
                </div>
            </div>

            {/* {(otherIncomeDetails.length > 0 || otherExpenseDetails.length > 0) && (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {otherIncomeDetails.length > 0 && (
                        <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b border-border px-3 py-2">
                                <div>
                                    <p className="text-sm font-semibold leading-tight text-card-foreground">Other Income Details</p>
                                    <p className="text-[11px] leading-tight text-muted-foreground">{otherIncomeDetails.length} {otherIncomeDetails.length === 1 ? "entry" : "entries"}</p>
                                </div>

                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-success/10 text-success">
                                    <TrendingUp size={15} />
                                </div>
                            </div>

                            <div className="min-w-0 overflow-hidden [&_table]:!w-full [&_table]:!min-w-full [&_.overflow-x-auto]:!overflow-x-hidden [&_th]:!py-2 [&_th]:!text-xs [&_td]:!py-2 [&_td]:!text-sm">
                                <DataTable
                                    columns={incomeColumns}
                                    data={otherIncomeDetails}
                                    loading={analysisLoading}
                                    emptyMessage="No other income data found"
                                    showFieldSelector={false}
                                />
                            </div>
                        </div>
                    )}

                    {otherExpenseDetails.length > 0 && (
                        <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b border-border px-3 py-2">
                                <div>
                                    <p className="text-sm font-semibold leading-tight text-card-foreground">Other Expense Details</p>
                                    <p className="text-[11px] leading-tight text-muted-foreground">{otherExpenseDetails.length} {otherExpenseDetails.length === 1 ? "entry" : "entries"}</p>
                                </div>

                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-danger/10 text-danger">
                                    <TrendingDown size={15} />
                                </div>
                            </div>

                            <div className="min-w-0 overflow-hidden [&_table]:!w-full [&_table]:!min-w-full [&_.overflow-x-auto]:!overflow-x-hidden [&_th]:!py-2 [&_th]:!text-xs [&_td]:!py-2 [&_td]:!text-sm">
                                <DataTable
                                    columns={expenseColumns}
                                    data={otherExpenseDetails}
                                    loading={analysisLoading}
                                    emptyMessage="No other expense data found"
                                    showFieldSelector={false}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )} */}

            <div className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 shadow-sm ${netProfit >= 0 ? "border-success/20" : "border-danger/20"}`}>
                <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${netProfit >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                        <WalletCards size={17} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold leading-tight text-card-foreground">{netProfit >= 0 ? "Net Profit" : "Net Loss"}</p>
                        <p className="text-[11px] leading-tight text-muted-foreground">Income minus expenses</p>
                    </div>
                </div>

                <span className={`text-lg font-bold ${netProfit >= 0 ? "text-success" : "text-danger"}`}>
                    ₹{formatAmount(Math.abs(netProfit))}
                </span>
            </div>
        </div>
    );
};

export default ProfitAndLoss;