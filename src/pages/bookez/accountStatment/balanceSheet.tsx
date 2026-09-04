import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronDown, LoaderCircle, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "../../../components/DataTable";
import ReportFilterCard from "../reports/components/ReportFilterCard";
import { clearBalanceSheetAnalysis, getBalanceSheetAnalysis } from "../../../redux/slices/professionalSlice/accountStatment";
import { getFirstDateOfCurrentMonth, todayYMD } from "../../../utils/helperFunctions";

const formatAmount = (value: any) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatFromDate = (date: string) => {
  if (!date) return "";
  return new Date(`${date}T00:00:00.000+05:30`).toISOString();
};

const formatToDate = (date: string) => {
  if (!date) return "";
  return new Date(`${date}T23:59:59.999+05:30`).toISOString();
};

const getRows = (...values: any[]) => {
  for (const value of values) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.rows)) return value.rows;
    if (Array.isArray(value?.details)) return value.details;
    if (Array.isArray(value?.items)) return value.items;
  }
  return [];
};

const getParticular = (row: any) => row?.particular || row?.accountName || row?.name || row?.ledgerName || row?.groupName || "-";

const getAmount = (row: any) => Number(row?.amount ?? row?.balance ?? row?.closingBalance ?? row?.total ?? row?.value ?? 0);

const assetsColumns = [
  {
    key: "particular",
    title: "Particular",
    render: (row: any) => <span className="text-sm font-medium text-card-foreground">{getParticular(row)}</span>
  },
  {
    key: "amount",
    title: "Amount",
    render: (row: any) => <span className="text-sm font-semibold text-success">₹{formatAmount(getAmount(row))}</span>
  }
];

const liabilitiesColumns = [
  {
    key: "particular",
    title: "Particular",
    render: (row: any) => <span className="text-sm font-medium text-card-foreground">{getParticular(row)}</span>
  },
  {
    key: "amount",
    title: "Amount",
    render: (row: any) => <span className="text-sm font-semibold text-primary">₹{formatAmount(getAmount(row))}</span>
  }
];

const BalanceSheet = () => {
  const dispatch = useDispatch<any>();

  const profitLossState = useSelector((state: any) =>
    state?.profitLoss ||
    state?.profitAndLoss ||
    state?.accountStatement?.profitLoss ||
    state?.accountStatment?.profitLoss ||
    {}
  );

  const { balanceSheet = null, balanceSheetLoading = false } = profitLossState;

  const [fromDate, setFromDate] = useState<string>(getFirstDateOfCurrentMonth());
  const [toDate, setToDate] = useState<string>(todayYMD());
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  const balanceSheetData = useMemo(() => balanceSheet?.data || balanceSheet || {}, [balanceSheet]);

  const assetRows = useMemo(() => getRows(
    balanceSheetData?.assetRows,
    balanceSheetData?.assets,
    balanceSheetData?.assetsRows,
    balanceSheetData?.assetDetails,
    balanceSheetData?.currentAssets
  ), [balanceSheetData]);

  const liabilityRows = useMemo(() => getRows(
    balanceSheetData?.liabilityRows,
    balanceSheetData?.liabilities,
    balanceSheetData?.liabilitiesRows,
    balanceSheetData?.liabilityDetails,
    balanceSheetData?.liabilitiesAndEquity
  ), [balanceSheetData]);

  const calculatedAssets = useMemo(() => assetRows.reduce((total: number, row: any) => total + getAmount(row), 0), [assetRows]);
  const calculatedLiabilities = useMemo(() => liabilityRows.reduce((total: number, row: any) => total + getAmount(row), 0), [liabilityRows]);

  const totalAssets = Number(
    balanceSheetData?.totalAssets ??
    balanceSheetData?.assetTotal ??
    calculatedAssets
  );

  const totalLiabilities = Number(
    balanceSheetData?.totalLiabilities ??
    balanceSheetData?.totalLiabilitiesAndEquity ??
    balanceSheetData?.liabilityTotal ??
    calculatedLiabilities
  );

  const difference = totalAssets - totalLiabilities;

  const buildPayload = (exportType: "" | "pdf" | "excel" = "") => {
    const payload: any = {
      fromDate: formatFromDate(fromDate),
      toDate: formatToDate(toDate)
    };

    if (exportType) payload.exportType = exportType;

    return payload;
  };

  useEffect(() => {
    if (!fromDate || !toDate) return;
    dispatch(getBalanceSheetAnalysis(buildPayload()) as any);
  }, [dispatch, fromDate, toDate]);

  useEffect(() => () => {
    dispatch(clearBalanceSheetAnalysis());
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
      const res = await dispatch(getBalanceSheetAnalysis(buildPayload("pdf")) as any).unwrap();
      if (res?.blob instanceof Blob) downloadBlobFile(res.blob, "balance-sheet.pdf");
    } catch (error) {
      console.log("Balance Sheet PDF download failed", error);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (excelLoading) return;

    try {
      setExcelLoading(true);
      const res = await dispatch(getBalanceSheetAnalysis(buildPayload("excel")) as any).unwrap();
      if (res?.blob instanceof Blob) downloadBlobFile(res.blob, "balance-sheet.xlsx");
    } catch (error) {
      console.log("Balance Sheet Excel download failed", error);
    } finally {
      setExcelLoading(false);
    }
  };

  const filterFields: any[] = [
    { key: "fromDate", type: "date", label: "From Date", value: fromDate, onChange: (value: string) => setFromDate(value), required: true },
    { key: "toDate", type: "date", label: "To Date", value: toDate, onChange: (value: string) => setToDate(value), required: true }
  ];

  return (
    <div className="relative flex h-full w-full flex-col gap-3 bg-background p-3 text-foreground">
      <AnimatePresence>
        {balanceSheetLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-[1px]">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 shadow-lg">
              <LoaderCircle size={19} className="animate-spin text-primary" />
              <div>
                <p className="text-xs font-semibold text-card-foreground">Loading Balance Sheet</p>
                <p className="text-[11px] text-muted-foreground">Preparing report data...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full">
        <button type="button" onClick={() => setFiltersOpen((previous) => !previous)} className="mb-1 flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left shadow-sm transition-colors duration-200 hover:bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 size={15} />
            </div>

            <div>
              <p className="text-sm font-semibold leading-tight text-card-foreground">Balance Sheet Filters</p>
              <p className="text-[11px] leading-tight text-muted-foreground">Select report date range</p>
            </div>
          </div>

          <motion.span animate={{ rotate: filtersOpen ? 180 : 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <ChevronDown size={17} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div key="balance-sheet-filters" initial={{ height: 0, opacity: 0, y: -5 }} animate={{ height: "auto", opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -5 }} transition={{ height: { duration: 0.3, ease: "easeInOut" }, opacity: { duration: 0.2 }, y: { duration: 0.25, ease: "easeOut" } }} className="overflow-hidden">
              <div className="mt-1 w-full [&>*]:rounded-lg [&>*]:!border-border [&>*]:!p-3 [&>*]:shadow-sm [&_h3]:!hidden [&_h2]:!hidden [&_p]:!text-xs [&_label]:!text-xs [&_input]:!h-9 [&_input]:!text-sm [&_select]:!h-9 [&_select]:!text-sm">
                <ReportFilterCard
                  title=""
                  fields={filterFields}
                  gridCols="4"
                  onDownloadPdf={handleDownloadPdf}
                  onDownloadExcel={handleDownloadExcel}
                  pdfDisabled={pdfLoading || balanceSheetLoading}
                  excelDisabled={excelLoading || balanceSheetLoading}
                  pdfLoading={pdfLoading}
                  excelLoading={excelLoading}
                  downloadDisabledMessage="Please wait while Balance Sheet is loading."
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
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Assets</p>
              <p className="mt-0.5 truncate text-lg font-bold leading-tight text-success">₹{formatAmount(totalAssets)}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
              <TrendingUp size={17} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-primary/20 bg-card px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Liabilities</p>
              <p className="mt-0.5 truncate text-lg font-bold leading-tight text-primary">₹{formatAmount(totalLiabilities)}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Landmark size={17} />
            </div>
          </div>
        </div>

        <div className={`rounded-lg border bg-card px-3 py-2.5 shadow-sm ${Math.abs(difference) < 0.01 ? "border-success/20" : "border-danger/20"}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Difference</p>
              <p className={`mt-0.5 truncate text-lg font-bold leading-tight ${Math.abs(difference) < 0.01 ? "text-success" : "text-danger"}`}>₹{formatAmount(Math.abs(difference))}</p>
            </div>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${Math.abs(difference) < 0.01 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
              <Scale size={17} />
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
                <p className="text-sm font-semibold leading-tight text-card-foreground">Assets</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{assetRows.length} {assetRows.length === 1 ? "entry" : "entries"}</p>
              </div>
            </div>

            <span className="rounded-md bg-success/10 px-2.5 py-1 text-xs font-bold text-success">₹{formatAmount(totalAssets)}</span>
          </div>

          <div className="min-w-0 overflow-hidden [&_table]:!w-full [&_table]:!min-w-full [&_.overflow-x-auto]:!overflow-x-hidden [&_th]:!py-2 [&_th]:!text-xs [&_td]:!py-2 [&_td]:!text-sm">
            <DataTable columns={assetsColumns} data={assetRows} loading={balanceSheetLoading} emptyMessage="No asset data found" showFieldSelector={false} />
          </div>
        </div>

        <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-primary/[0.03] px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <TrendingDown size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight text-card-foreground">Liabilities & Equity</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{liabilityRows.length} {liabilityRows.length === 1 ? "entry" : "entries"}</p>
              </div>
            </div>

            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">₹{formatAmount(totalLiabilities)}</span>
          </div>

          <div className="min-w-0 overflow-hidden [&_table]:!w-full [&_table]:!min-w-full [&_.overflow-x-auto]:!overflow-x-hidden [&_th]:!py-2 [&_th]:!text-xs [&_td]:!py-2 [&_td]:!text-sm">
            <DataTable columns={liabilitiesColumns} data={liabilityRows} loading={balanceSheetLoading} emptyMessage="No liability data found" showFieldSelector={false} />
          </div>
        </div>
      </div>

      <div className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 shadow-sm ${Math.abs(difference) < 0.01 ? "border-success/20" : "border-danger/20"}`}>
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${Math.abs(difference) < 0.01 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
            <Scale size={17} />
          </div>

          <div>
            <p className="text-sm font-semibold leading-tight text-card-foreground">Balance Sheet</p>
            <p className="text-[11px] leading-tight text-muted-foreground">
              {Math.abs(difference) < 0.01 ? "Assets and liabilities are balanced" : "Difference between assets and liabilities"}
            </p>
          </div>
        </div>

        <span className={`text-lg font-bold ${Math.abs(difference) < 0.01 ? "text-success" : "text-danger"}`}>
          ₹{formatAmount(Math.abs(difference))}
        </span>
      </div>
    </div>
  );
};

export default BalanceSheet;