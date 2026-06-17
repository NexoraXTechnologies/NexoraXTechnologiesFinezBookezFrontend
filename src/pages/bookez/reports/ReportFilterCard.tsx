import { FileDown } from "lucide-react";
import { SelectInput } from "../../../components/inputs";

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

    pdfButtonText = "PDF",
    excelButtonText = "Excel",

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
        inline-flex h-8 w-fit min-w-[82px] items-center justify-center gap-1.5 rounded-md px-3
        text-xs font-semibold text-white transition
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
                        label={field.label}
                        name={field.key}
                        value={field.value || ""}
                        mandatory={field.required}
                        disabled={field.disabled}
                        placeholder={field.placeholder || `Select ${field.label}`}
                        onChange={(event: any) => field.onChange(event.target.value)}
                        options={[
                            {
                                label: field.placeholder || `Select ${field.label}`,
                                value: "",
                            },
                            ...(field.options || []),
                        ]}
                        styles={{
                            control: (base: any, state: any) => ({
                                ...base,
                                minHeight: "32px",
                                height: "32px",
                                borderRadius: "0.375rem",
                                borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
                                boxShadow: state.isFocused ? "0 0 0 1px #bfdbfe" : "none",
                            }),

                            valueContainer: (base: any) => ({
                                ...base,
                                height: "30px",
                                minHeight: "30px",
                                padding: "0 12px",
                                display: "flex",
                                alignItems: "center",
                            }),

                            placeholder: (base: any) => ({
                                ...base,
                                position: "absolute",
                                top: "50%",
                                transform: "translateY(-50%)",
                                margin: 0,
                                color: "#64748b",
                                fontSize: "13px",
                                fontWeight: 400,
                                lineHeight: "1",
                            }),

                            singleValue: (base: any) => ({
                                ...base,
                                position: "absolute",
                                top: "50%",
                                transform: "translateY(-50%)",
                                margin: 0,
                                color: field.value ? "#0f172a" : "#64748b",
                                fontSize: "13px",
                                fontWeight: field.value ? 500 : 400,
                                lineHeight: "1",
                            }),

                            input: (base: any) => ({
                                ...base,
                                margin: 0,
                                padding: 0,
                                height: "30px",
                                display: "flex",
                                alignItems: "center",
                                fontSize: "13px",
                            }),

                            indicatorsContainer: (base: any) => ({
                                ...base,
                                height: "30px",
                                minHeight: "30px",
                                display: "flex",
                                alignItems: "center",
                            }),

                            dropdownIndicator: (base: any) => ({
                                ...base,
                                padding: "4px",
                                color: "#94a3b8",
                            }),
                        }}
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
            {/* <h3 className="mb-4 text-sm font-bold text-slate-900">
                {title}
            </h3> */}

            <div className="flex flex-col gap-3">
                <div className={`grid gap-3 ${gridClass}`}>
                    {fields.map(renderField)}
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        {downloadDisabled && downloadDisabledMessage && (
                            <p className="truncate text-[11px] font-medium text-slate-500">
                                {downloadDisabledMessage}
                            </p>
                        )}
                    </div>

                    {(showPdfButton || showExcelButton) && (
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                            {showPdfButton && (
                                <button
                                    type="button"
                                    onClick={onDownloadPdf}
                                    disabled={downloadDisabled}
                                    className={downloadButtonClass}
                                    title={
                                        downloadDisabled
                                            ? downloadDisabledMessage
                                            : pdfButtonText
                                    }
                                >
                                    <FileDown size={12} />
                                    {pdfButtonText}
                                </button>
                            )}

                            {showExcelButton && (
                                <button
                                    type="button"
                                    onClick={onDownloadExcel}
                                    disabled={downloadDisabled}
                                    className={downloadButtonClass}
                                    title={
                                        downloadDisabled
                                            ? downloadDisabledMessage
                                            : excelButtonText
                                    }
                                >
                                    <FileDown size={12} />
                                    {excelButtonText}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportFilterCard;