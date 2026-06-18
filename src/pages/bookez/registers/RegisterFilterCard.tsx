import { FileDown, RefreshCw, RotateCcw } from "lucide-react";
import { SelectInput } from "../../../components/inputs";
import { PrimaryButton } from "../../../components/buttons";

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
    colSpan?: 1 | 2 | 3 | 4 | "full";
};

type ReportFilterCardProps = {
    title?: string;
    fields: ReportFilterField[];

    onSearch?: () => void;
    onClear?: () => void;
    onDownloadPdf?: () => void;
    onDownloadExcel?: () => void;

    showSearchButton?: boolean;
    showClearButton?: boolean;
    showPdfButton?: boolean;
    showExcelButton?: boolean;

    actionDisabled?: boolean;
    downloadDisabled?: boolean;
    downloadDisabledMessage?: string;

    searchButtonText?: string;
    clearButtonText?: string;
    pdfButtonText?: string;
    excelButtonText?: string;

    gridCols?: "1" | "2" | "3" | "4";
};

const RegisterFilterCard = ({
    title = "Filters",
    fields = [],

    onSearch,
    onClear,
    onDownloadPdf,
    onDownloadExcel,

    showSearchButton = true,
    showClearButton = true,
    showPdfButton = true,
    showExcelButton = true,

    actionDisabled,
    downloadDisabled = false,
    downloadDisabledMessage = "Please select required fields to download report.",

    searchButtonText = "Refresh",
    clearButtonText = "Clear",
    pdfButtonText = "PDF",
    excelButtonText = "Excel",

    gridCols = "2",
}: ReportFilterCardProps) => {
    const isSelectFieldSelected = fields.some(
        (field) =>
            field.type === "select" &&
            String(field.value || "").trim()
    );

    const finalActionDisabled = actionDisabled ?? !isSelectFieldSelected;
    const finalDownloadDisabled = downloadDisabled || finalActionDisabled;

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

    const primaryButtonClass = `
        !h-8 !min-w-[76px] !px-3 !text-xs
        disabled:!cursor-not-allowed
        disabled:!from-indigo-200
        disabled:!to-violet-100
        disabled:!text-indigo-400
        disabled:!shadow-none
        disabled:hover:!from-indigo-200
        disabled:hover:!to-violet-100
        disabled:hover:!shadow-none
        disabled:active:!scale-100
    `;

    const renderField = (field: ReportFilterField) => {
        const wrapperClass = `relative ${getColSpanClass(field.colSpan)}`;

        if (field.type === "date") {
            return (
                <div key={field.key} className={wrapperClass}>
                    <label className="absolute -top-2.5 left-3 z-10 bg-white px-1 text-xs font-medium text-slate-500">
                        {field.label}
                        {field.required && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>

                    <div className="flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-3">
                        <input
                            type="date"
                            value={field.value}
                            disabled={field.disabled}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                        />
                    </div>
                </div>
            );
        }

        if (field.type === "select") {
            return (
                <div key={field.key} className={wrapperClass}>
                    <SelectInput
                        name={field.key}
                        value={field.value || ""}
                        mandatory={field.required}
                        disabled={field.disabled}
                        placeholder={field.placeholder || `Select ${field.label}`}
                        onChange={(event: any) =>
                            field.onChange(event.target.value)
                        }
                        options={[
                            {
                                label:
                                    field.placeholder ||
                                    `Select ${field.label}`,
                                value: "",
                            },
                            ...(field.options || []),
                        ]}
                    />
                </div>
            );
        }

        if (field.type === "text") {
            return (
                <div key={field.key} className={wrapperClass}>
                    <label className="absolute -top-2.5 left-3 z-10 bg-white px-1 text-xs font-medium text-slate-500">
                        {field.label}
                        {field.required && (
                            <span className="ml-1 text-red-500">*</span>
                        )}
                    </label>

                    <div className="flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-3">
                        <input
                            type="text"
                            value={field.value}
                            disabled={field.disabled}
                            placeholder={field.placeholder}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                        />
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3">
                {title && (
                    <h3 className="text-sm font-bold text-slate-900">
                        {title}
                    </h3>
                )}

                <div className={`grid gap-3 ${gridClass}`}>
                    {fields.map(renderField)}
                </div>

                <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        {finalDownloadDisabled && downloadDisabledMessage ? (
                            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px]">
                                    !
                                </span>

                                <span className="truncate">
                                    {downloadDisabledMessage}
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px]">
                                    ✓
                                </span>
                                Ready to generate register
                            </div>
                        )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                        {showSearchButton && (
                            <PrimaryButton
                                callBackFn={onSearch}
                                disabled={finalActionDisabled}
                                text={searchButtonText}
                                icon={<RefreshCw size={13} />}
                                className={primaryButtonClass}
                            />
                        )}

                        {showClearButton && (
                            <PrimaryButton
                                callBackFn={onClear}
                                disabled={finalActionDisabled}
                                text={clearButtonText}
                                icon={<RotateCcw size={13} />}
                                className={primaryButtonClass}
                            />
                        )}

                        {showPdfButton && (
                            <PrimaryButton
                                callBackFn={onDownloadPdf}
                                disabled={finalDownloadDisabled}
                                text={pdfButtonText}
                                icon={<FileDown size={13} />}
                                className={primaryButtonClass}
                            />
                        )}

                        {showExcelButton && (
                            <PrimaryButton
                                callBackFn={onDownloadExcel}
                                disabled={finalDownloadDisabled}
                                text={excelButtonText}
                                icon={<FileDown size={13} />}
                                className={primaryButtonClass}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterFilterCard;