import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../../components/DataTable";
import { clearProfitLossState, getProfitLossAnalysis, getProfitLossFilterOptions } from "../../../redux/slices/professionalSlice/accountStatment/profitAndLoss";
import { getFirstDateOfCurrentMonth, todayYMD } from "../../../utils/helperFunctions";
import ReportFilterCard from "../reports/components/ReportFilterCard";

type ProfitLossProps = { show?: boolean; };
type SelectOption = { label: string; value: string; };
type CustomMasterModule = { moduleName: string; options: SelectOption[]; };

const getDatePayload = (date: string, endOfDay = false) => {
    if (!date) return "";
    const value = new Date(`${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
    return value.toISOString();
};

const getAmount = (row: any) => Number(
    row?.amount ??
    row?.balance ??
    row?.netAmount ??
    row?.closingBalance ??
    row?.totalAmount ??
    row?.value ??
    0
);

const getAccountName = (row: any) => (
    row?.accountName ||
    row?.name ||
    row?.ledgerName ||
    row?.particular ||
    row?.particulars ||
    row?.account ||
    "-"
);

const getArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.details)) return value.details;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.records)) return value.records;
    if (Array.isArray(value?.accounts)) return value.accounts;
    if (Array.isArray(value?.data)) return value.data;
    return [];
};

const getIncomeDetails = (data: any) => {
    const values = [
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

    for (const value of values) {
        const records = getArray(value);
        if (records.length) return records;
    }

    return [];
};

const getExpenseDetails = (data: any) => {
    const values = [
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

    for (const value of values) {
        const records = getArray(value);
        if (records.length) return records;
    }

    return [];
};

const getFilterModules = (data: any): CustomMasterModule[] => {
    if (!data) return [];

    const possibleRoots = [
        data?.customMasterFilters,
        data?.customMasters,
        data?.filters,
        data?.modules,
        data?.filterOptions,
        data
    ];

    let modules: any[] = [];

    for (const root of possibleRoots) {
        if (Array.isArray(root)) {
            modules = root;
            break;
        }
    }

    return modules
        .map((module: any) => {
            const moduleName = String(
                module?.moduleName ||
                module?.name ||
                module?.label ||
                module?.customMasterName ||
                ""
            ).trim();

            const records =
                getArray(module?.options).length ? getArray(module?.options) :
                    getArray(module?.items).length ? getArray(module?.items) :
                        getArray(module?.records).length ? getArray(module?.records) :
                            getArray(module?.values).length ? getArray(module?.values) :
                                getArray(module?.data);

            const seen = new Set<string>();

            const options = records.reduce((list: SelectOption[], item: any) => {
                const value = String(item?.code || item?.value || item?.moduleCode || item?._id || "").trim();
                const label = String(item?.name || item?.label || item?.description || item?.code || item?.value || "").trim();

                if (!value || seen.has(value)) return list;

                seen.add(value);
                list.push({ label: label || value, value });

                return list;
            }, []);

            return { moduleName, options };
        })
        .filter((module: CustomMasterModule) => module.moduleName && module.options.length);
};

const amountColumn = {
    key: "amount",
    title: "Amount",
    render: (row: any) => (
        <span className="font-semibold text-card-foreground">
            ₹{getAmount(row).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    )
};

const incomeColumns = [
    {
        key: "accountName",
        title: "Particular",
        render: (row: any) => <span className="font-medium text-card-foreground">{getAccountName(row)}</span>
    },
    amountColumn
];

const expenseColumns = [
    {
        key: "accountName",
        title: "Particular",
        render: (row: any) => <span className="font-medium text-card-foreground">{getAccountName(row)}</span>
    },
    amountColumn
];

const ProfitLoss = ({ show = true }: ProfitLossProps) => {
    const dispatch = useDispatch<any>();

    const {
        filterOptions = [],
        analysis = null,
        filterOptionsLoading = false,
        analysisLoading = false
    } = useSelector((state: any) => state.profitLoss);

    const [fromDate, setFromDate] = useState<string>(getFirstDateOfCurrentMonth());
    const [toDate, setToDate] = useState<string>(todayYMD());
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [customMasterValues, setCustomMasterValues] = useState<Record<string, string>>({});
    const [pdfLoading, setPdfLoading] = useState(false);
    const [excelLoading, setExcelLoading] = useState(false);

    const customMasterModules = useMemo(() => getFilterModules(filterOptions), [filterOptions]);

    const customMasterFilters = useMemo(() => {
        return Object.entries(customMasterValues)
            .filter(([, code]) => Boolean(code))
            .map(([moduleName, code]) => ({ moduleName, code }));
    }, [customMasterValues]);

    const incomeDetails = useMemo(() => getIncomeDetails(analysis), [analysis]);
    const expenseDetails = useMemo(() => getExpenseDetails(analysis), [analysis]);

    const calculatedIncome = useMemo(() => {
        return incomeDetails.reduce((total: number, row: any) => total + getAmount(row), 0);
    }, [incomeDetails]);

    const calculatedExpense = useMemo(() => {
        return expenseDetails.reduce((total: number, row: any) => total + getAmount(row), 0);
    }, [expenseDetails]);

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
        analysis?.analysis?.netProfit ??
        (totalIncome - totalExpense)
    );

    const formatAmount = (value: any) => {
        return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const buildPayload = (exportType: "" | "pdf" | "excel" = "") => {
        const payload: any = {
            fromDate: getDatePayload(fromDate),
            toDate: getDatePayload(toDate, true)
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

    useEffect(() => {
        if (!show) resetProfitLoss();
    }, [show]);

    useEffect(() => {
        if (!fromDate || !toDate) return;

        dispatch(getProfitLossFilterOptions({
            fromDate: getDatePayload(fromDate),
            toDate: getDatePayload(toDate, true),
            exportType: ""
        }));
    }, [dispatch, fromDate, toDate]);

    useEffect(() => {
        if (!fromDate || !toDate) return;
        dispatch(getProfitLossAnalysis(buildPayload()));
    }, [dispatch, fromDate, toDate, customMasterFilters]);

    useEffect(() => {
        setCustomMasterValues((previous) => {
            const validModules = new Set(customMasterModules.map((module) => module.moduleName));
            const next: Record<string, string> = {};

            Object.entries(previous).forEach(([moduleName, code]) => {
                if (validModules.has(moduleName)) next[moduleName] = code;
            });

            return next;
        });
    }, [customMasterModules]);

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

            const res = await dispatch(getProfitLossAnalysis(buildPayload("pdf"))).unwrap();
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

            const res = await dispatch(getProfitLossAnalysis(buildPayload("excel"))).unwrap();
            const blob = res?.blob || res?.data;

            if (blob instanceof Blob) downloadBlobFile(blob, "profit-loss.xlsx");
        } catch (error) {
            console.log("Profit & Loss Excel download failed", error);
        } finally {
            setExcelLoading(false);
        }
    };

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
        ...customMasterModules.map((module) => ({
            key: module.moduleName,
            type: "select",
            label: module.moduleName,
            placeholder: filterOptionsLoading ? `Loading ${module.moduleName}...` : `All ${module.moduleName}`,
            value: customMasterValues[module.moduleName] || "",
            options: module.options,
            disabled: filterOptionsLoading,
            required: false,
            onChange: (value: string) => {
                setCustomMasterValues((previous) => ({ ...previous, [module.moduleName]: value }));
            }
        }))
    ];

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <div className="w-full">
                <button
                    type="button"
                    onClick={() => setFiltersOpen((prev) => !prev)}
                    className="mb-1 flex w-full cursor-pointer items-center justify-between rounded-md border border-border bg-card px-4 py-2.5 text-left transition-colors duration-200 hover:bg-muted/40"
                >
                    <span className="text-sm font-semibold text-card-foreground">Profit & Loss Filters</span>

                    <motion.span
                        animate={{ rotate: filtersOpen ? 180 : 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="flex text-muted-foreground"
                    >
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
                    <span className="font-medium text-muted-foreground">
                        {netProfitLoss >= 0 ? "Net Profit:" : "Net Loss:"}
                    </span>{" "}
                    <span className={`font-bold ${netProfitLoss >= 0 ? "text-success" : "text-danger"}`}>
                        ₹{formatAmount(Math.abs(netProfitLoss))}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                        <span className="text-sm font-semibold text-card-foreground">Income</span>

                        <span className="text-sm font-bold text-success">
                            ₹{formatAmount(totalIncome)}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <DataTable
                            columns={incomeColumns}
                            data={incomeDetails}
                            loading={analysisLoading}
                            emptyMessage="No income data found"
                            showFieldSelector={false}
                        />
                    </div>
                </div>

                <div className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                        <span className="text-sm font-semibold text-card-foreground">Expenses</span>

                        <span className="text-sm font-bold text-danger">
                            ₹{formatAmount(totalExpense)}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <DataTable
                            columns={expenseColumns}
                            data={expenseDetails}
                            loading={analysisLoading}
                            emptyMessage="No expense data found"
                            showFieldSelector={false}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
                <span className="text-sm font-semibold text-card-foreground">
                    {netProfitLoss >= 0 ? "Net Profit" : "Net Loss"}
                </span>

                <span className={`text-base font-bold ${netProfitLoss >= 0 ? "text-success" : "text-danger"}`}>
                    ₹{formatAmount(Math.abs(netProfitLoss))}
                </span>
            </div>
        </div>
    );
};

export default ProfitLoss;