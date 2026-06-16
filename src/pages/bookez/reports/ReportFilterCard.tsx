// import { CalendarDays, ChevronDown, FileDown } from "lucide-react";

// type Option = {
//     label: string;
//     value: string;
// };

// type ReportFilterCardProps = {
//     fromDate: string;
//     toDate: string;
//     accountValue: string;
//     accountOptions?: Option[];
//     accountPlaceholder?: string;
//     onFromDateChange: (value: string) => void;
//     onToDateChange: (value: string) => void;
//     onAccountChange: (value: string) => void;
//     onDownloadPdf?: () => void;
//     onDownloadExcel?: () => void;
//     showPdfButton?: boolean;
//     showExcelButton?: boolean;
//     downloadDisabled?: boolean;
// };

// const ReportFilterCard = ({
//     fromDate,
//     toDate,
//     accountValue,
//     accountOptions = [],
//     accountPlaceholder = "Select Customer/Vendor",
//     onFromDateChange,
//     onToDateChange,
//     onAccountChange,
//     onDownloadPdf,
//     onDownloadExcel,
//     showPdfButton = true,
//     showExcelButton = true,
//     downloadDisabled = false,
// }: ReportFilterCardProps) => {
//     const downloadButtonClass = `
//         flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition
//         ${
//             downloadDisabled
//                 ? "cursor-not-allowed bg-slate-300 text-slate-500"
//                 : "bg-blue-500 hover:bg-blue-600"
//         }
//     `;

//     return (
//         <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <h3 className="mb-5 text-lg font-bold text-slate-900">
//                 Filters
//             </h3>

//             <div className="flex flex-col gap-4">
//                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                     <div className="relative">
//                         <label className="absolute -top-3 left-4 bg-white px-1 text-sm font-medium text-slate-500">
//                             From Date
//                         </label>

//                         <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
//                             <CalendarDays
//                                 size={18}
//                                 className="text-slate-600"
//                             />

//                             <input
//                                 type="date"
//                                 value={fromDate}
//                                 onChange={(e) =>
//                                     onFromDateChange(e.target.value)
//                                 }
//                                 className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
//                             />
//                         </div>
//                     </div>

//                     <div className="relative">
//                         <label className="absolute -top-3 left-4 bg-white px-1 text-sm font-medium text-slate-500">
//                             To Date
//                         </label>

//                         <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
//                             <CalendarDays
//                                 size={18}
//                                 className="text-slate-600"
//                             />

//                             <input
//                                 type="date"
//                                 value={toDate}
//                                 onChange={(e) =>
//                                     onToDateChange(e.target.value)
//                                 }
//                                 className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 <div className="relative">
//                     <div className="relative">
//                         <select
//                             value={accountValue}
//                             onChange={(e) => onAccountChange(e.target.value)}
//                             className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
//                         >
//                             <option value="">{accountPlaceholder}</option>

//                             {accountOptions.map((option) => (
//                                 <option key={option.value} value={option.value}>
//                                     {option.label}
//                                 </option>
//                             ))}
//                         </select>

//                         <ChevronDown
//                             size={20}
//                             className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
//                         />
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//                     {showPdfButton && (
//                         <button
//                             type="button"
//                             onClick={onDownloadPdf}
//                             disabled={downloadDisabled}
//                             className={downloadButtonClass}
//                         >
//                             <FileDown size={18} />
//                             Download PDF
//                         </button>
//                     )}

//                     {showExcelButton && (
//                         <button
//                             type="button"
//                             onClick={onDownloadExcel}
//                             disabled={downloadDisabled}
//                             className={downloadButtonClass}
//                         >
//                             <FileDown size={18} />
//                             Download Excel
//                         </button>
//                     )}
//                 </div>

//                 {downloadDisabled && (
//                     <p className="text-xs font-medium text-slate-500">
//                         Please select a customer/vendor to download report.
//                     </p>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default ReportFilterCard;

import { ChevronDown, FileDown, Search } from "lucide-react";

type Option = {
    label: string;
    value: string;
};

type FilterFieldType = "date" | "select" | "text";

export type ReportFilterField = {
    key: string;
    type: FilterFieldType;
    label: string;
    value: string;
    placeholder?: string;
    options?: Option[];
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;

    // ✅ New: field width control
    colSpan?: 1 | 2 | 3 | 4 | "full";
};

type ReportFilterCardProps = {
    title?: string;
    fields: ReportFilterField[];

    onDownloadPdf?: () => void;
    onDownloadExcel?: () => void;

    showPdfButton?: boolean;
    showExcelButton?: boolean;

    downloadDisabled?: boolean;
    downloadDisabledMessage?: string;

    pdfButtonText?: string;
    excelButtonText?: string;

    gridCols?: "1" | "2" | "3" | "4";
};

const ReportFilterCard = ({
    title = "Filters",
    fields = [],

    onDownloadPdf,
    onDownloadExcel,

    showPdfButton = true,
    showExcelButton = true,

    downloadDisabled = false,
    downloadDisabledMessage = "Please select required fields to download report.",

    pdfButtonText = "Download PDF",
    excelButtonText = "Download Excel",

    gridCols = "2",
}: ReportFilterCardProps) => {
    const gridClass =
        gridCols === "1"
            ? "grid-cols-1"
            : gridCols === "2"
                ? "grid-cols-1 md:grid-cols-2"
                : gridCols === "3"
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";

    const getColSpanClass = (colSpan?: ReportFilterField["colSpan"]) => {
        if (!colSpan || colSpan === 1) return "";

        if (colSpan === "full") {
            if (gridCols === "1") return "col-span-1";
            if (gridCols === "2") return "md:col-span-2";
            if (gridCols === "3") return "md:col-span-2 xl:col-span-3";
            return "md:col-span-2 xl:col-span-4";
        }

        if (colSpan === 2) return "md:col-span-2";
        if (colSpan === 3) return "md:col-span-2 xl:col-span-3";
        if (colSpan === 4) return "md:col-span-2 xl:col-span-4";

        return "";
    };

    const downloadButtonClass = `
        flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition
        ${downloadDisabled
            ? "cursor-not-allowed bg-slate-300 text-slate-500"
            : "bg-blue-500 hover:bg-blue-600"
        }
    `;

    const renderField = (field: ReportFilterField) => {
        const wrapperClass = `relative ${getColSpanClass(field.colSpan)}`;

        if (field.type === "date") {
            return (
                <div key={field.key} className={wrapperClass}>
                    <label className="absolute -top-3 left-4 z-10 bg-white px-1 text-sm font-medium text-slate-500">
                        {field.label}
                        {field.required && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>

                    <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">

                        <input
                            type="date"
                            value={field.value}
                            disabled={field.disabled}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                        />
                    </div>
                </div>
            );
        }

        if (field.type === "select") {
            return (
                <div key={field.key} className={wrapperClass}>
                    <label className="mb-1 block text-sm font-medium text-slate-500">
                        {field.label}
                        {field.required && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>

                    <div className="relative">
                        <select
                            value={field.value}
                            disabled={field.disabled}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                            <option value="">
                                {field.placeholder || `Select ${field.label}`}
                            </option>

                            {(field.options || []).map((option) => (
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
            );
        }

        return (
            <div key={field.key} className={wrapperClass}>
                <label className="mb-1 block text-sm font-medium text-slate-500">
                    {field.label}
                    {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                    )}
                </label>

                <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100">
                    <Search size={18} className="text-slate-500" />

                    <input
                        type="text"
                        value={field.value}
                        disabled={field.disabled}
                        placeholder={field.placeholder || field.label}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-5 text-lg font-bold text-slate-900">
                {title}
            </h3>

            <div className="flex flex-col gap-4">
                <div className={`grid gap-4 ${gridClass}`}>
                    {fields.map(renderField)}
                </div>

                {(showPdfButton || showExcelButton) && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {showPdfButton && (
                            <button
                                type="button"
                                onClick={onDownloadPdf}
                                disabled={downloadDisabled}
                                className={downloadButtonClass}
                            >
                                <FileDown size={18} />
                                {pdfButtonText}
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
                                {excelButtonText}
                            </button>
                        )}
                    </div>
                )}

                {downloadDisabled && downloadDisabledMessage && (
                    <p className="text-xs font-medium text-slate-500">
                        {downloadDisabledMessage}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ReportFilterCard;