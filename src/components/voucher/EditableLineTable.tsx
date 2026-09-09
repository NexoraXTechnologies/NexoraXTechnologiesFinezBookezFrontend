import { Edit, Plus, Trash2 } from "lucide-react";
import { CreatableSelectInput, SelectInput, TextInput } from "../inputs";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import { formatDateForList, money } from "../../utils/helperFunctions";
import { capitalizeFirstLttr } from "../../utils/templateKeyLabel";

type ColumnType = "select" | "custommaster" | "accountmaster" | "productmaster" | "unitmaster" | "employeemaster" | "text" | "number" | "date";

export type EditableColumn = {
    key: string;
    title?: string;
    label?: string;
    type: ColumnType;
    width?: string;
    placeholder?: string;
    options?: any[];
    required?: boolean;
    isRequired?: boolean;
    disabled?: boolean | string;
    isReadonly?: boolean | string;
    isHidden?: boolean | string;
    align?: "left" | "right" | "center";
    largeData?: boolean;
    showCreateOnEmpty?: boolean;
    createOptionLabel?:
    | string
    | ((searchValue: string) => string);
    onCreateOption?: (
        searchValue: string,
        rowIndex: number,
        row: any
    ) => void | Promise<void>;
};

type EditableLineTableProps = {
    bodyTitle: string;
    isAddButton: boolean;
    isView: boolean;
    addButtonText?: string;
    rows: any[];
    columns: EditableColumn[];
    errors?: any;
    onAddRow: () => void;
    onDeleteRow: (index: number) => void;
    onRefrenceRow?: (index: number, row?: any) => void;
    RefrenceBtnText?:
    | string
    | ((row: any, index: number) => string);
    onChange: (index: number, key: string, value: any) => void;
    emptyText?: string;
    isRefrenceAction: boolean;
    isColumnVisible?: (
        column: EditableColumn,
        rows: any[]
    ) => boolean;
    isCellVisible?: (
        column: EditableColumn,
        row: any,
        rowIndex: number
    ) => boolean;
    isCellDisabled?: (
        column: EditableColumn,
        row: any,
        rowIndex: number
    ) => boolean;

    renderCellExtra?: (
        column: EditableColumn,
        row: any,
        rowIndex: number
    ) => React.ReactNode;
};

const LEFT_WIDTH = "70px";
const ACTION_WIDTH = "120px";
const HEADER_HEIGHT = "52px";
const ROW_HEIGHT = "70px";

const EditableLineTable = ({
    bodyTitle,
    isView,
    addButtonText = "Add Row",
    rows = [],
    columns = [],
    errors = {},
    onAddRow,
    onDeleteRow,
    onRefrenceRow,
    onChange,
    isAddButton,
    isRefrenceAction,
    RefrenceBtnText,
    emptyText = "No data found",
    isColumnVisible,
    isCellVisible,
    isCellDisabled,
    renderCellExtra,
}: EditableLineTableProps) => {
    const getReferenceButtonText = (
        row: any,
        rowIndex: number
    ) => {
        if (typeof RefrenceBtnText === "function") {
            return RefrenceBtnText(row, rowIndex);
        }

        if (RefrenceBtnText) {
            return RefrenceBtnText;
        }

        return Array.isArray(row?.references) &&
            row.references.length > 0
            ? "Edit Reference"
            : "Add Reference";
    };

    const getReferenceIcon = (row: any) => {
        return Array.isArray(row?.references) &&
            row.references.length > 0 ? (
            <Edit size={16} />
        ) : (
            <Plus size={16} />
        );
    };

    const getColumnLabel = (column: EditableColumn) => {
        return (
            column?.label ||
            column?.title ||
            capitalizeFirstLttr(column?.key)
        );
    };

    const getColumnMinWidth = (column: EditableColumn) => {
        return column?.width || "220px";
    };

    const getTextAlignClass = (
        align?: "left" | "right" | "center"
    ) => {
        if (align === "right") return "text-right";
        if (align === "center") return "text-center";
        return "text-left";
    };

    const getHeaderJustifyClass = (
        align?: "left" | "right" | "center"
    ) => {
        if (align === "right") return "justify-end";
        if (align === "center") return "justify-center";
        return "justify-start";
    };

    const isTrueValue = (value: any) => {
        return (
            value === true ||
            String(value ?? "").trim().toLowerCase() === "true"
        );
    };

    const getColumnType = (column: EditableColumn) => {
        return String(
            column?.type || ""
        )
            .trim()
            .toLowerCase();
    };

    const isCustomMasterColumn = (
        column: EditableColumn
    ) => {
        return (
            getColumnType(column) ===
            "custommaster"
        );
    };

    // STANDARD MASTER CHECK

    const isStandardMasterColumn = (
        column: EditableColumn
    ) => {
        const type = getColumnType(column);

        return (
            type === "accountmaster" ||
            type === "productmaster" ||
            type === "unitmaster" ||
            type === "employeemaster"
        );
    };

    const isSelectColumn = (
        column: EditableColumn
    ) => {
        const type =
            getColumnType(column);

        return (
            type === "select" ||
            type === "custommaster" ||
            type === "accountmaster" ||
            type === "productmaster" ||
            type === "unitmaster" ||
            type === "employeemaster"
        );
    };

    const getCellValue = (
        row: any,
        column: EditableColumn
    ) => {
        if (isCustomMasterColumn(column)) {
            const directValue = row?.[column.key];

            if (
                directValue !== undefined &&
                directValue !== null &&
                directValue !== ""
            ) {
                if (
                    typeof directValue ===
                    "object"
                ) {
                    return (
                        directValue?.code ||
                        directValue?.value ||
                        ""
                    );
                }

                return directValue;
            }

            const customMasterValue =
                row?.customMasters?.[
                column.key
                ];

            if (
                customMasterValue &&
                typeof customMasterValue ===
                "object"
            ) {
                return (
                    customMasterValue?.code ||
                    customMasterValue?.value ||
                    ""
                );
            }

            return "";
        }

        // STANDARD MASTER VALUE

        if (isStandardMasterColumn(column)) {
            const directValue = row?.[column.key];

            if (
                directValue === undefined ||
                directValue === null ||
                directValue === ""
            ) {
                return "";
            }

            if (typeof directValue !== "object") {
                return directValue;
            }

            const type = getColumnType(column);

            if (type === "accountmaster") {
                return (
                    directValue?.accountCode ||
                    directValue?.code ||
                    directValue?.value ||
                    ""
                );
            }

            if (type === "productmaster") {
                return (
                    directValue?.productCode ||
                    directValue?.code ||
                    directValue?.value ||
                    ""
                );
            }

            if (type === "unitmaster") {
                return (
                    directValue?.unitCode ||
                    directValue?.code ||
                    directValue?.value ||
                    ""
                );
            }

            if (type === "employeemaster") {
                return (
                    directValue?.userMobileNumberHash ||
                    directValue?.code ||
                    directValue?.value ||
                    ""
                );
            }

            return (
                directValue?.value ||
                directValue?.code ||
                ""
            );
        }

        return (
            row?.[
            column.key
            ] ??
            ""
        );
    };

    const normalizeOptions = (column: EditableColumn) => {
        return (column?.options || []).map((option: any) => {
            if (typeof option === "object") {
                return {
                    ...option,
                    label: option?.label || option?.accountName || option?.productName || option?.unitName || option?.userFirstName || option?.name || option?.value || option?.code || "",
                    value: option?.value || option?.accountCode || option?.productCode || option?.unitCode || option?.userMobileNumberHash || option?.code || option?._id || option?.name || "",
                };
            }

            return {
                label: String(option),
                value: option,
            };
        });
    };

    const visibleColumns = columns.filter((column) => {
        if (isColumnVisible) {
            return isColumnVisible(column, rows);
        }

        return !isTrueValue(column?.isHidden);
    });

    return (
        <div className="w-full max-w-full min-w-0 text-card-foreground">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <h3 className="text-md font-bold text-card-foreground">
                    {bodyTitle}
                </h3>

                {!isView && isAddButton && (
                    <button
                        type="button"
                        onClick={onAddRow}
                        className="flex items-center gap-2 rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 active:scale-[0.98]"
                    >
                        <Plus size={16} />
                        {addButtonText}
                    </button>
                )}
            </div>

            <div className="w-full max-w-full overflow-hidden rounded-md border border-border bg-card shadow-sm">
                <div
                    className="grid w-full"
                    style={{
                        gridTemplateColumns: isView
                            ? `${LEFT_WIDTH} minmax(0, 1fr)`
                            : `${LEFT_WIDTH} minmax(0, 1fr) ${ACTION_WIDTH}`,
                    }}
                >
                    <div className="relative z-[30] border-r border-border bg-card">
                        <div
                            className="flex items-center justify-center border-b border-border bg-secondary px-3 text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground"
                            style={{ height: HEADER_HEIGHT }}
                        >
                            #
                        </div>

                        {!rows.length ? (
                            <div
                                className="border-b border-border bg-card"
                                style={{ minHeight: "120px" }}
                            />
                        ) : (
                            rows.map((row, rowIndex) => (
                                <div
                                    key={row.id || rowIndex}
                                    className="flex items-center justify-center border-b border-border bg-card px-3 text-center text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
                                    style={{ minHeight: ROW_HEIGHT }}
                                >
                                    {rowIndex + 1}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="min-w-0 overflow-x-auto overflow-y-hidden">
                        <table
                            className="w-max min-w-full border-separate border-spacing-0 text-sm"
                            style={{ tableLayout: "auto" }}
                        >
                            <thead>
                                <tr>
                                    {visibleColumns.map((column) => (
                                        <th
                                            key={column.key}
                                            className={`border-b border-r border-border bg-secondary px-4 py-3 text-xs font-bold uppercase tracking-wide text-secondary-foreground ${getTextAlignClass(
                                                column.align
                                            )}`}
                                            style={{
                                                minWidth:
                                                    getColumnMinWidth(
                                                        column
                                                    ),
                                                height: HEADER_HEIGHT,
                                            }}
                                        >
                                            <div
                                                className={`flex items-center gap-1 ${getHeaderJustifyClass(
                                                    column.align
                                                )}`}
                                            >
                                                <span>
                                                    {getColumnLabel(
                                                        column
                                                    )}
                                                </span>

                                                {isTrueValue(
                                                    column?.isRequired ??
                                                    column?.required
                                                ) && (
                                                        <span className="text-danger">
                                                            *
                                                        </span>
                                                    )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {!rows.length ? (
                                    <tr>
                                        <td
                                            colSpan={Math.max(
                                                visibleColumns.length,
                                                1
                                            )}
                                            className="bg-card px-6 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                    #
                                                </div>

                                                <p className="text-sm font-semibold text-card-foreground">
                                                    No rows found
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {emptyText}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row, rowIndex) => (
                                        <tr
                                            key={row.id || rowIndex}
                                            className="group transition-colors hover:bg-muted"
                                        >
                                            {visibleColumns.map((column) => {
                                                const showCell = isCellVisible
                                                    ? isCellVisible(
                                                        column,
                                                        row,
                                                        rowIndex
                                                    )
                                                    : true;

                                                const calculatedField =
                                                    column.key ===
                                                    "taxGross" ||
                                                    column.key ===
                                                    "nonTaxGross";

                                                const disabledCell =
                                                    isView ||
                                                    isTrueValue(
                                                        isCellDisabled?.(
                                                            column,
                                                            row,
                                                            rowIndex
                                                        )
                                                    ) ||
                                                    isTrueValue(
                                                        column.disabled
                                                    ) ||
                                                    isTrueValue(
                                                        column.isReadonly
                                                    ) ||
                                                    calculatedField;

                                                const cellValue =
                                                    getCellValue(
                                                        row,
                                                        column
                                                    );

                                                const selectOptions =
                                                    normalizeOptions(
                                                        column
                                                    );

                                                return (
                                                    <td
                                                        key={column.key}
                                                        className="border-b border-r border-border bg-card px-3 py-3 transition-colors group-hover:bg-muted"
                                                        style={{
                                                            minWidth:
                                                                getColumnMinWidth(
                                                                    column
                                                                ),
                                                            height: ROW_HEIGHT,
                                                        }}
                                                    >
                                                        {!showCell ? (
                                                            <div className="flex min-h-[42px] items-center justify-center text-muted-foreground">
                                                                —
                                                            </div>
                                                        ) : (
                                                            <div className="relative min-w-0">
                                                                {isSelectColumn(
                                                                    column
                                                                ) ? (
                                                                    typeof column.onCreateOption ===
                                                                        "function" &&
                                                                        !isCustomMasterColumn(
                                                                            column
                                                                        ) &&
                                                                        !isStandardMasterColumn(
                                                                            column
                                                                        ) ? (
                                                                        <CreatableSelectInput
                                                                            label=""
                                                                            value={
                                                                                cellValue
                                                                            }
                                                                            placeholder={
                                                                                column.placeholder ||
                                                                                `Select ${getColumnLabel(
                                                                                    column
                                                                                )}`
                                                                            }
                                                                            error={
                                                                                errors?.[
                                                                                `row_${rowIndex}_${column.key}`
                                                                                ]
                                                                            }
                                                                            disabled={
                                                                                disabledCell
                                                                            }
                                                                            largeData={
                                                                                column.largeData ??
                                                                                true
                                                                            }
                                                                            showCreateOnEmpty={
                                                                                column.showCreateOnEmpty ??
                                                                                true
                                                                            }
                                                                            createOptionLabel={
                                                                                column.createOptionLabel
                                                                            }
                                                                            onCreateOption={(
                                                                                searchValue
                                                                            ) =>
                                                                                column.onCreateOption?.(
                                                                                    searchValue,
                                                                                    rowIndex,
                                                                                    row
                                                                                )
                                                                            }
                                                                            onChange={(
                                                                                event: any
                                                                            ) =>
                                                                                onChange(
                                                                                    rowIndex,
                                                                                    column.key,
                                                                                    event
                                                                                        ?.target
                                                                                        ?.value
                                                                                )
                                                                            }
                                                                            options={
                                                                                selectOptions
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <SelectInput
                                                                            label=""
                                                                            mandatory={
                                                                                false
                                                                            }
                                                                            value={
                                                                                cellValue
                                                                            }
                                                                            placeholder={
                                                                                column.placeholder ||
                                                                                `Select ${getColumnLabel(
                                                                                    column
                                                                                )}`
                                                                            }
                                                                            error={
                                                                                errors?.[
                                                                                `row_${rowIndex}_${column.key}`
                                                                                ]
                                                                            }
                                                                            disabled={
                                                                                disabledCell
                                                                            }
                                                                            largeData={
                                                                                isCustomMasterColumn(column) ||
                                                                                    isStandardMasterColumn(column)
                                                                                    ? true
                                                                                    : column.largeData
                                                                            }
                                                                            onChange={(
                                                                                event: any
                                                                            ) =>
                                                                                onChange(
                                                                                    rowIndex,
                                                                                    column.key,
                                                                                    event
                                                                                        ?.target
                                                                                        ?.value
                                                                                )
                                                                            }
                                                                            options={[
                                                                                {
                                                                                    label:
                                                                                        column.placeholder ||
                                                                                        `Select ${getColumnLabel(
                                                                                            column
                                                                                        )}`,
                                                                                    value: "",
                                                                                },
                                                                                ...selectOptions,
                                                                            ]}
                                                                        />
                                                                    )
                                                                ) : (
                                                                    <TextInput
                                                                        label=""
                                                                        mandatory={
                                                                            false
                                                                        }
                                                                        type={
                                                                            column.type ===
                                                                                "number" ||
                                                                                column.key ===
                                                                                "nonTaxRate" ||
                                                                                calculatedField
                                                                                ? "number"
                                                                                : column.type ===
                                                                                    "date"
                                                                                    ? "date"
                                                                                    : "text"
                                                                        }
                                                                        value={
                                                                            column.type === "date" &&
                                                                                cellValue
                                                                                ? String(
                                                                                    cellValue
                                                                                ).split(
                                                                                    "T"
                                                                                )[0]
                                                                                : cellValue
                                                                        }
                                                                        placeholder={
                                                                            column.placeholder ||
                                                                            getColumnLabel(
                                                                                column
                                                                            )
                                                                        }
                                                                        error={
                                                                            errors?.[
                                                                            `row_${rowIndex}_${column.key}`
                                                                            ]
                                                                        }
                                                                        disabled={
                                                                            disabledCell
                                                                        }
                                                                        onKeyDown={(event: any) => {
                                                                            const isNumberField =
                                                                                column.type === "number" ||
                                                                                column.key === "nonTaxRate" ||
                                                                                calculatedField;

                                                                            if (
                                                                                isNumberField &&
                                                                                String(cellValue ?? "") === "0" &&
                                                                                /^[1-9]$/.test(event.key)
                                                                            ) {
                                                                                event.preventDefault();

                                                                                onChange(
                                                                                    rowIndex,
                                                                                    column.key,
                                                                                    event.key
                                                                                );
                                                                            }
                                                                        }}
                                                                        onChange={(event: any) =>
                                                                            onChange(
                                                                                rowIndex,
                                                                                column.key,
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                    />
                                                                )}

                                                                {renderCellExtra?.(
                                                                    column,
                                                                    row,
                                                                    rowIndex
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!isView && (
                        <div className="relative z-[30] border-l border-border bg-card">
                            <div
                                className="flex items-center justify-center border-b border-border bg-secondary px-3 text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground"
                                style={{ height: HEADER_HEIGHT }}
                            >
                                Action
                            </div>

                            {!rows.length ? (
                                <div
                                    className="border-b border-border bg-card"
                                    style={{ minHeight: "120px" }}
                                />
                            ) : (
                                rows.map((row, rowIndex) => (
                                    <div
                                        key={row.id || rowIndex}
                                        className="flex items-center justify-center border-b border-border bg-card px-3 py-3 transition-colors hover:bg-muted"
                                        style={{ minHeight: ROW_HEIGHT }}
                                    >
                                        <div className="flex w-full items-center justify-center gap-2">
                                            {isRefrenceAction &&
                                                onRefrenceRow && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onRefrenceRow(
                                                                rowIndex,
                                                                row
                                                            )
                                                        }
                                                        className="flex h-8 items-center justify-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
                                                        title={getReferenceButtonText(
                                                            row,
                                                            rowIndex
                                                        )}
                                                    >
                                                        {getReferenceIcon(
                                                            row
                                                        )}
                                                    </button>
                                                )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onDeleteRow(rowIndex)
                                                }
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-danger/20 bg-danger/10 text-danger transition hover:border-danger/30 hover:bg-danger/20 active:scale-[0.96]"
                                                title="Delete"
                                                aria-label={`Delete row ${rowIndex + 1}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
interface MultiInvoiceEditableTableProps {
    invoices?: any[];
    schema?: any[];
    errors?: any;
    onDeleteInvoice?: (index: number) => void;
    onInvoiceChange?: (index: number, key: string, value: any) => void;
    readonly?: boolean;
    showDelete?: boolean;
    title?: string;
}

const isTrueValue = (value: any) => value === true || String(value ?? "").trim().toLowerCase() === "true";

const getDisplayValue = (value: any, field?: any) => {
    if (value === undefined || value === null || value === "") return "-";

    if (field?.type === "date") {
        try {
            return formatDateForList(value);
        }
        catch {
            return String(value);
        }
    }

    if (field?.type === "boolean") return isTrueValue(value) ? "Yes" : "No";

    if (typeof value === "object") return value?.name || value?.label || value?.code || value?.value || "-";

    return String(value);
};

const getInvoiceHeaderSchema = (schema: any[]) => {
    return (schema || []).filter((field: any) => field?.key && field?.key !== "sInvBody" && field?.key !== "sInvFooter" && !isTrueValue(field?.isHidden));
};

const getProductSchema = (schema: any[]) => {
    const bodyField = (schema || []).find((field: any) => field?.key === "sInvBody");
    return Array.isArray(bodyField?.fields) ? bodyField.fields : [];
};

const normalizeEditableColumnType = (type: any) => {
    const normalizedType = String(type || "").trim().toLowerCase();

    if (normalizedType === "select") return "select";
    if (normalizedType === "number") return "number";
    if (normalizedType === "date") return "date";

    return "text";
};

const normalizeProductColumns = (fields: any[]) => {
    return (fields || []).map((field: any) => ({
        ...field,
        type: normalizeEditableColumnType(field?.type),
        disabled: true,
        isReadonly: true,
    }));
};

const MultiInvoiceEditableTable = ({
    invoices = [],
    schema = [],
    errors = {},
    onDeleteInvoice,
    onInvoiceChange,
    readonly = true,
    showDelete = true,
    title = "Sales Invoices",
}: MultiInvoiceEditableTableProps) => {
    const [expandedInvoices, setExpandedInvoices] = useState<Record<number, boolean>>({});

    const invoiceFields = useMemo(() => getInvoiceHeaderSchema(schema), [schema]);

    const productColumns = useMemo(() => {
        const productFields = getProductSchema(schema);
        return normalizeProductColumns(productFields);
    }, [schema]);

    const toggleInvoice = (index: number) => {
        setExpandedInvoices((previous) => ({
            ...previous,
            [index]: previous[index] === false ? true : false,
        }));
    };

    const isExpanded = (index: number) => expandedInvoices[index] !== false;

    if (!invoices.length) {
        return (
            <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                No Sales Invoice selected
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {invoices.length} Sales Invoice{invoices.length === 1 ? "" : "s"} selected
                    </p>
                </div>
            </div>

            {invoices.map((invoice: any, invoiceIndex: number) => {
                const expanded = isExpanded(invoiceIndex);
                const invoiceNumber = invoice?.sInvNo || invoice?.sInvVoucherNumber || `Invoice ${invoiceIndex + 1}`;

                return (
                    <div key={`${invoiceNumber}-${invoiceIndex}`} className="overflow-hidden rounded-md border border-border bg-card">
                        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
                            <button
                                type="button"
                                onClick={() => toggleInvoice(invoiceIndex)}
                                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                            >
                                <span className="text-primary">
                                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </span>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-card-foreground">
                                        {invoiceNumber}
                                    </p>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {(invoice?.sInvBody || []).length} Product{(invoice?.sInvBody || []).length === 1 ? "" : "s"}
                                    </p>
                                </div>
                            </button>

                            {showDelete && onDeleteInvoice && (
                                <button
                                    type="button"
                                    onClick={() => onDeleteInvoice(invoiceIndex)}
                                    className="cursor-pointer rounded-md p-2 text-danger transition hover:bg-danger/10"
                                    title="Remove Invoice"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        {expanded && (
                            <div className="space-y-4 p-4">
                                {invoiceFields.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {invoiceFields.map((field: any) => {
                                            const error = errors?.[`row_${invoiceIndex}_${field.key}`];
                                            const value = invoice?.[field.key];
                                            const disabled = readonly || isTrueValue(field?.isReadonly) || isTrueValue(field?.disabled);

                                            return (
                                                <div key={field.key} className="min-w-0">
                                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                        {field?.label || field?.title || field?.key}
                                                        {isTrueValue(field?.isRequired) && <span className="ml-0.5 text-danger">*</span>}
                                                    </label>

                                                    {field?.type === "date" ? (
                                                        <input
                                                            type="date"
                                                            value={value ? String(value).split("T")[0] : ""}
                                                            disabled={disabled}
                                                            onChange={(event) => onInvoiceChange?.(invoiceIndex, field.key, event.target.value)}
                                                            className={`w-full rounded-md border bg-input px-3 py-2 text-sm text-foreground outline-none ${error ? "border-danger" : "border-border"} disabled:cursor-not-allowed disabled:opacity-70`}
                                                        />
                                                    ) : field?.type === "boolean" ? (
                                                        <div className="flex min-h-[38px] items-center rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-card-foreground">
                                                            {isTrueValue(value) ? "Yes" : "No"}
                                                        </div>
                                                    ) : disabled ? (
                                                        <div className={`min-h-[38px] rounded-md border bg-muted/20 px-3 py-2 text-sm text-card-foreground ${error ? "border-danger" : "border-border"}`}>
                                                            {getDisplayValue(value, field)}
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type={field?.type === "number" ? "number" : "text"}
                                                            value={value ?? ""}
                                                            onChange={(event) => onInvoiceChange?.(invoiceIndex, field.key, event.target.value)}
                                                            className={`w-full rounded-md border bg-input px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? "border-danger" : "border-border"}`}
                                                        />
                                                    )}

                                                    {error && <p className="mt-1 text-xs text-danger">{error}</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <EditableLineTable
                                    isView={true}
                                    bodyTitle="Invoice Products"
                                    addButtonText="Add Product"
                                    rows={invoice?.sInvBody || []}
                                    columns={productColumns}
                                    errors={{}}
                                    onAddRow={() => { }}
                                    onDeleteRow={() => { }}
                                    onRefrenceRow={() => { }}
                                    onChange={() => { }}
                                    emptyText="No products found"
                                    isAddButton={false}
                                    isRefrenceAction={false}
                                />

                                {invoice?.sInvFooter && (
                                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-3 lg:grid-cols-5">
                                        <div className="rounded-md bg-muted/30 p-2">
                                            <p className="text-xs text-muted-foreground">Gross</p>
                                            <p className="mt-0.5 text-sm font-semibold">
                                                {money(invoice?.sInvFooter?.grossAmount || 0)}
                                            </p>
                                        </div>

                                        <div className="rounded-md bg-muted/30 p-2">
                                            <p className="text-xs text-muted-foreground">Discount</p>
                                            <p className="mt-0.5 text-sm font-semibold">
                                                {money(invoice?.sInvFooter?.discountAmount || 0)}
                                            </p>
                                        </div>

                                        <div className="rounded-md bg-muted/30 p-2">
                                            <p className="text-xs text-muted-foreground">Tax</p>
                                            <p className="mt-0.5 text-sm font-semibold">
                                                {money(invoice?.sInvFooter?.taxAmount || 0)}
                                            </p>
                                        </div>

                                        <div className="rounded-md bg-muted/30 p-2">
                                            <p className="text-xs text-muted-foreground">Net Amount</p>
                                            <p className="mt-0.5 text-sm font-semibold text-primary">
                                                {money(invoice?.sInvFooter?.netAmount || 0)}
                                            </p>
                                        </div>

                                        <div className="rounded-md bg-muted/30 p-2">
                                            <p className="text-xs text-muted-foreground">Balance</p>
                                            <p className="mt-0.5 text-sm font-semibold">
                                                {money(invoice?.sInvFooter?.balanceAmount || invoice?.sInvFooter?.netAmount || 0)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export { MultiInvoiceEditableTable }
export default EditableLineTable;