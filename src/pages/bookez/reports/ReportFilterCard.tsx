import { CalendarDays, ChevronDown, FileDown } from "lucide-react";

type Option = {
    label: string;
    value: string;
};

type ReportFilterCardProps = {
    fromDate: string;
    toDate: string;
    accountValue: string;
    accountOptions?: Option[];
    accountPlaceholder?: string;
    onFromDateChange: (value: string) => void;
    onToDateChange: (value: string) => void;
    onAccountChange: (value: string) => void;
    onDownloadPdf?: () => void;
    onDownloadExcel?: () => void;
    showPdfButton?: boolean;
    showExcelButton?: boolean;
    downloadDisabled?: boolean;
};

const ReportFilterCard = ({
    fromDate,
    toDate,
    accountValue,
    accountOptions = [],
    accountPlaceholder = "Select Customer/Vendor",
    onFromDateChange,
    onToDateChange,
    onAccountChange,
    onDownloadPdf,
    onDownloadExcel,
    showPdfButton = true,
    showExcelButton = true,
    downloadDisabled = false,
}: ReportFilterCardProps) => {
    const downloadButtonClass = `
        flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition
        ${
            downloadDisabled
                ? "cursor-not-allowed bg-slate-300 text-slate-500"
                : "bg-blue-500 hover:bg-blue-600"
        }
    `;

    return (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
                Filters
            </h3>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="relative">
                        <label className="absolute -top-3 left-4 bg-white px-1 text-sm font-medium text-slate-500">
                            From Date
                        </label>

                        <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                            <CalendarDays
                                size={18}
                                className="text-slate-600"
                            />

                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) =>
                                    onFromDateChange(e.target.value)
                                }
                                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="absolute -top-3 left-4 bg-white px-1 text-sm font-medium text-slate-500">
                            To Date
                        </label>

                        <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                            <CalendarDays
                                size={18}
                                className="text-slate-600"
                            />

                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) =>
                                    onToDateChange(e.target.value)
                                }
                                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="relative">
                        <select
                            value={accountValue}
                            onChange={(e) => onAccountChange(e.target.value)}
                            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
                        >
                            <option value="">{accountPlaceholder}</option>

                            {accountOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <ChevronDown
                            size={20}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {showPdfButton && (
                        <button
                            type="button"
                            onClick={onDownloadPdf}
                            disabled={downloadDisabled}
                            className={downloadButtonClass}
                        >
                            <FileDown size={18} />
                            Download PDF
                        </button>
                    )}

                    {showExcelButton && (
                        <button
                            type="button"
                            onClick={onDownloadExcel}
                            disabled={downloadDisabled}
                            className={downloadButtonClass}
                        >
                            <FileDown size={18} />
                            Download Excel
                        </button>
                    )}
                </div>

                {downloadDisabled && (
                    <p className="text-xs font-medium text-slate-500">
                        Please select a customer/vendor to download report.
                    </p>
                )}
            </div>
        </div>
    );
};

export default ReportFilterCard;