import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../../components/DataTable";

import { clearProfitLossState, getProfitLossAnalysis, getProfitLossFilterOptions } from "../../../redux/slices/professionalSlice/accountStatment/profitAndLoss";
import { formatDateWithCurrentTime, getFirstDateOfCurrentMonth, todayYMD } from "../../../utils/helperFunctions";
import ReportFilterCard from "../reports/components/ReportFilterCard";

type ProfitLossProps = { show?: boolean; };

const getArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.details)) return value.details;
    if (Array.isArray(value?.records)) return value.records;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.accounts)) return value.accounts;
    if (Array.isArray(value?.data)) return value.data;
    return [];
};

const getIncomeDetails = (data: any) => {
    const possibilities = [
        data?.incomeDetails,
        data?.incomes,
        data?.income,
        data?.incomeAccounts,
        data?.details?.income,
        data?.details?.incomes,
        data?.profitLoss?.incomeDetails,
        data?.profitLoss?.income,
        data?.analysis?.incomeDetails,
        data?.analysis?.income
    ];

    for (const item of possibilities) {
        const records = getArray(item);
        if (records.length) return records;
    }

    return [];
};

const getExpenseDetails = (data: any) => {
    const possibilities = [
        data?.expenseDetails,
        data?.expenses,
        data?.expense,
        data?.expenseAccounts,
        data?.details?.expense,
        data?.details?.expenses,
        data?.profitLoss?.expenseDetails,
        data?.profitLoss?.expenses,
        data?.analysis?.expenseDetails,
        data?.analysis?.expenses
    ];

    for (const item of possibilities) {
        const records = getArray(item);
        if (records.length) return records;
    }

    return [];
};

const getAccountName = (row: any) => row?.accountName || row?.name || row?.ledgerName || row?.particular || row?.particulars || row?.account || "-";

const getAmount = (row: any) => Number(row?.amount ?? row?.balance ?? row?.netAmount ?? row?.closingBalance ?? row?.totalAmount ?? row?.value ?? 0);

const formatAmount = (value: any) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const incomeColumns = [
    {
        key: "accountName",
        title: "Particular",
        render: (row: any) => <span className="font-medium text-card-foreground">{getAccountName(row)}</span>
    },
    {
        key: "amount",
        title: "Amount",
        render: (row: any) => <span className="font-semibold text-success">₹{formatAmount(getAmount(row))}</span>
    }
];

const expenseColumns = [
    {
        key: "accountName",
        title: "Particular",
        render: (row: any) => <span className="font-medium text-card-foreground">{getAccountName(row)}</span>
    },
    {
        key: "amount",
        title: "Amount",
        render: (row: any) => <span className="font-semibold text-danger">₹{formatAmount(getAmount(row))}</span>
    }
];

const ProfitAndLoss = ({ show = true }: ProfitLossProps) => {
    const dispatch = useDispatch<any>();

    const { filterOptions = null, analysis = null, filterOptionsLoading = false, analysisLoading = false } = useSelector((state: any) => state.profitLoss || {});

    const [fromDate, setFromDate] = useState<string>(getFirstDateOfCurrentMonth());
    const [toDate, setToDate] = useState<string>(todayYMD());
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [customMasterValues, setCustomMasterValues] = useState<Record<string, string>>({});
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    // FILTER API RESPONSE -> SELECT DATA
    const customMasterModules = useMemo(() => {
        return (filterOptions?.filters || []).map((filter: any) => ({
            moduleCode: filter?.moduleCode || "",
            moduleName: filter?.moduleName || "",
            description: filter?.description || "",
            totalEntries: Number(filter?.totalEntries || 0),
            options: (filter?.entries || []).map((entry: any) => ({
                label: entry?.name || entry?.code || "",
                value: entry?.code || ""
            })).filter((item: any) => item.label && item.value)
        })).filter((filter: any) => filter.moduleName);
    }, [filterOptions]);

    // SELECTED FILTERS -> ANALYSIS PAYLOAD
    const customMasterFilters = useMemo(() => {
        return Object.entries(customMasterValues)
            .filter(([, code]) => Boolean(String(code || "").trim()))
            .map(([moduleName, code]) => ({ moduleName, code }));
    }, [customMasterValues]);

    const incomeDetails = useMemo(() => getIncomeDetails(analysis), [analysis]);
    const expenseDetails = useMemo(() => getExpenseDetails(analysis), [analysis]);

    const calculatedIncome = useMemo(() => incomeDetails.reduce((total: number, row: any) => total + getAmount(row), 0), [incomeDetails]);
    const calculatedExpense = useMemo(() => expenseDetails.reduce((total: number, row: any) => total + getAmount(row), 0), [expenseDetails]);

    const totalIncome = Number(
        analysis?.totalIncome ??
        analysis?.incomeTotal ??
        analysis?.summary?.totalIncome ??
        analysis?.profitLoss?.totalIncome ??
        analysis?.analysis?.totalIncome ??
        calculatedIncome
    );

    const totalExpense = Number(
        analysis?.totalExpense ??
        analysis?.totalExpenses ??
        analysis?.expenseTotal ??
        analysis?.summary?.totalExpense ??
        analysis?.summary?.totalExpenses ??
        analysis?.profitLoss?.totalExpense ??
        analysis?.profitLoss?.totalExpenses ??
        analysis?.analysis?.totalExpense ??
        calculatedExpense
    );

    const netProfitLoss = Number(
        analysis?.netProfit ??
        analysis?.netProfitLoss ??
        analysis?.profit ??
        analysis?.summary?.netProfit ??
        analysis?.summary?.netProfitLoss ??
        analysis?.profitLoss?.netProfit ??
        analysis?.profitLoss?.netProfitLoss ??
        analysis?.analysis?.netProfit ??
        (totalIncome - totalExpense)
    );

    const buildPayload = (exportType: "" | "pdf" | "excel" = "") => {
        const payload: any = {
            fromDate: formatDateWithCurrentTime(fromDate),
            toDate: formatDateWithCurrentTime(toDate)
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
        dispatch(getProfitLossFilterOptions({}) as any);
    }, [dispatch]);

    // LOAD ANALYSIS
    useEffect(() => {
        if (!fromDate || !toDate) return;
        dispatch(getProfitLossAnalysis(buildPayload()) as any);
    }, [dispatch, fromDate, toDate, customMasterFilters]);

    // CLEAR INVALID SELECTED VALUES IF FILTER API CHANGES
    useEffect(() => {
        setCustomMasterValues((previous) => {
            const validModules = new Set(customMasterModules.map((item: any) => item.moduleName));
            const next: Record<string, string> = {};

            Object.entries(previous).forEach(([moduleName, code]) => {
                if (validModules.has(moduleName)) next[moduleName] = code;
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
            const blob = res?.blob || res?.data;

            if (blob instanceof Blob) downloadBlobFile(blob, "profit-loss.pdf");
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
            const blob = res?.blob || res?.data;

            if (blob instanceof Blob) downloadBlobFile(blob, "profit-loss.xlsx");
        } catch (error) {
            console.log("Profit & Loss Excel download failed", error);
        } finally {
            setExcelLoading(false);
        }
    };

    // FILTER UI
    const filterFields: any[] = [
        { key: "fromDate", type: "date", label: "From Date", value: fromDate, onChange: (value: string) => setFromDate(value), required: true },
        { key: "toDate", type: "date", label: "To Date", value: toDate, onChange: (value: string) => setToDate(value), required: true },

        ...customMasterModules.map((module: any) => ({
            key: module.moduleCode || module.moduleName,
            type: "select",
            label: module.moduleName,
            placeholder: module.options.length ? `All ${module.moduleName}` : `No ${module.moduleName} available`,
            value: customMasterValues[module.moduleName] || "",
            options: module.options,
            disabled: filterOptionsLoading || !module.options.length,
            required: false,
            onChange: (value: string) => setCustomMasterValues((previous) => ({ ...previous, [module.moduleName]: value }))
        }))
    ];

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <div className="w-full">
                <button
                    type="button"
                    onClick={() => setFiltersOpen((previous) => !previous)}
                    className="mb-1 flex w-full cursor-pointer items-center justify-between rounded-md border border-border bg-card px-4 py-2.5 text-left transition-colors duration-200 hover:bg-muted/40"
                >
                    <span className="text-sm font-semibold text-card-foreground">Profit & Loss Filters</span>

                    <motion.span animate={{ rotate: filtersOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="flex text-muted-foreground">
                        <ChevronDown size={18} />
                    </motion.span>
                </button>

                <AnimatePresence initial={false}>
                    {filtersOpen && (
                        <motion.div
                            key="profit-loss-filters"
                            initial={{ height: 0, opacity: 0, y: -6 }}
                            animate={{ height: "auto", opacity: 1, y: 0 }}
                            exit={{ height: 0, opacity: 0, y: -6 }}
                            transition={{ height: { duration: 0.3, ease: "easeInOut" }, opacity: { duration: 0.2 }, y: { duration: 0.25, ease: "easeOut" } }}
                            className="overflow-hidden"
                        >
                            <div className="w-full [&>*]:rounded-md [&>*]:!p-4 [&_h3]:!hidden [&_h2]:!hidden [&_p]:!text-sm [&_label]:!text-xs [&_input]:!h-10 [&_input]:!text-sm [&_select]:!h-10 [&_select]:!text-sm [&_.text-xl]:!text-lg [&_.text-lg]:!text-base">
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

            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm">
                <div>
                    <span className="font-medium text-muted-foreground">Total Income:</span>{" "}
                    <span className="font-semibold text-success">₹{formatAmount(totalIncome)}</span>
                </div>

                <div>
                    <span className="font-medium text-muted-foreground">Total Expenses:</span>{" "}
                    <span className="font-semibold text-danger">₹{formatAmount(totalExpense)}</span>
                </div>

                <div>
                    <span className="font-medium text-muted-foreground">{netProfitLoss >= 0 ? "Net Profit:" : "Net Loss:"}</span>{" "}
                    <span className={`font-bold ${netProfitLoss >= 0 ? "text-success" : "text-danger"}`}>₹{formatAmount(Math.abs(netProfitLoss))}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                        <span className="text-sm font-semibold text-card-foreground">Income</span>
                        <span className="text-sm font-bold text-success">₹{formatAmount(totalIncome)}</span>
                    </div>

                    <div className="min-w-0">
                        <DataTable columns={incomeColumns} data={incomeDetails} loading={analysisLoading} emptyMessage="No income data found" showFieldSelector={false} />
                    </div>
                </div>

                <div className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                        <span className="text-sm font-semibold text-card-foreground">Expenses</span>
                        <span className="text-sm font-bold text-danger">₹{formatAmount(totalExpense)}</span>
                    </div>

                    <div className="min-w-0">
                        <DataTable columns={expenseColumns} data={expenseDetails} loading={analysisLoading} emptyMessage="No expense data found" showFieldSelector={false} />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
                <span className="text-sm font-semibold text-card-foreground">{netProfitLoss >= 0 ? "Net Profit" : "Net Loss"}</span>
                <span className={`text-base font-bold ${netProfitLoss >= 0 ? "text-success" : "text-danger"}`}>₹{formatAmount(Math.abs(netProfitLoss))}</span>
            </div>
        </div>
    );
};

export default ProfitAndLoss;