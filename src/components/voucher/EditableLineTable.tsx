import { Edit, Plus, Trash2 } from "lucide-react";
import { CreatableSelectInput, SelectInput, TextInput } from "../inputs";
import { useMemo, useRef } from "react";
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
    createOptionLabel?: string | ((searchValue: string) => string);
    onCreateOption?: (searchValue: string, rowIndex: number, row: any) => void | Promise<void>;
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
    RefrenceBtnText?: string | ((row: any, index: number) => string);
    onChange: (index: number, key: string, value: any) => void;
    emptyText?: string;
    isRefrenceAction: boolean;
    isColumnVisible?: (column: EditableColumn, rows: any[]) => boolean;
    isCellVisible?: (column: EditableColumn, row: any, rowIndex: number) => boolean;
    isCellDisabled?: (column: EditableColumn, row: any, rowIndex: number) => boolean;
    renderCellExtra?: (column: EditableColumn, row: any, rowIndex: number) => React.ReactNode;
    isRowDeleteVisible?: (row: any, rowIndex: number) => boolean;
};

const LEFT_WIDTH = "70px";
const ACTION_WIDTH = "120px";
const HEADER_HEIGHT = "52px";
const ROW_HEIGHT = "70px";
const TABLE_MAX_HEIGHT = "30vh";

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
    isRowDeleteVisible,
}: EditableLineTableProps) => {
    const centerHeaderRef = useRef<HTMLDivElement | null>(null);

    const getReferenceButtonText = (row: any, rowIndex: number) => {
        if (typeof RefrenceBtnText === "function") return RefrenceBtnText(row, rowIndex);
        if (RefrenceBtnText) return RefrenceBtnText;
        return Array.isArray(row?.references) && row.references.length > 0 ? "Edit Reference" : "Add Reference";
    };

    const getReferenceIcon = (row: any) => Array.isArray(row?.references) && row.references.length > 0 ? <Edit size={16} /> : <Plus size={16} />;
    const getColumnLabel = (column: EditableColumn) => column?.label || column?.title || capitalizeFirstLttr(column?.key);
    const getColumnMinWidth = (column: EditableColumn) => column?.width || "220px";
    const getTextAlignClass = (align?: "left" | "right" | "center") => align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
    const getHeaderJustifyClass = (align?: "left" | "right" | "center") => align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";
    const isTrueValue = (value: any) => value === true || String(value ?? "").trim().toLowerCase() === "true";
    const getColumnType = (column: EditableColumn) => String(column?.type || "").trim().toLowerCase();
    const isCustomMasterColumn = (column: EditableColumn) => getColumnType(column) === "custommaster";

    // STANDARD MASTER CHECK
    const isStandardMasterColumn = (column: EditableColumn) => {
        const type = getColumnType(column);
        return type === "accountmaster" || type === "productmaster" || type === "unitmaster" || type === "employeemaster";
    };

    const isSelectColumn = (column: EditableColumn) => {
        const type = getColumnType(column);
        return type === "select" || type === "custommaster" || type === "accountmaster" || type === "productmaster" || type === "unitmaster" || type === "employeemaster";
    };

    const getCellValue = (row: any, column: EditableColumn) => {
        if (isCustomMasterColumn(column)) {
            const directValue = row?.[column.key];
            if (directValue !== undefined && directValue !== null && directValue !== "") {
                if (typeof directValue === "object") return directValue?.code || directValue?.value || "";
                return directValue;
            }

            const customMasterValue = row?.customMasters?.[column.key];
            if (customMasterValue && typeof customMasterValue === "object") return customMasterValue?.code || customMasterValue?.value || "";
            return "";
        }

        if (isStandardMasterColumn(column)) {
            const directValue = row?.[column.key];
            if (directValue === undefined || directValue === null || directValue === "") return "";
            if (typeof directValue !== "object") return directValue;

            const type = getColumnType(column);
            if (type === "accountmaster") return directValue?.accountCode || directValue?.code || directValue?.value || "";
            if (type === "productmaster") return directValue?.productCode || directValue?.code || directValue?.value || "";
            if (type === "unitmaster") return directValue?.unitCode || directValue?.code || directValue?.value || "";
            if (type === "employeemaster") return directValue?.userMobileNumberHash || directValue?.code || directValue?.value || "";
            return directValue?.value || directValue?.code || "";
        }

        return row?.[column.key] ?? "";
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
            return { label: String(option), value: option };
        });
    };

    const visibleColumns = columns.filter((column) => isColumnVisible ? isColumnVisible(column, rows) : !isTrueValue(column?.isHidden));

    const handleHorizontalScroll = (event: any) => {
        if (centerHeaderRef.current) centerHeaderRef.current.scrollLeft = event.currentTarget.scrollLeft;
    };

    const renderHeaderTable = () => (
        <table className="w-max min-w-full table-fixed border-separate border-spacing-0 text-sm">
            <colgroup>
                {visibleColumns.map((column) => <col key={column.key} style={{ width: getColumnMinWidth(column) }} />)}
            </colgroup>
            <thead>
                <tr>
                    {visibleColumns.map((column) => (
                        <th
                            key={column.key}
                            className={`border-b border-r border-border bg-secondary px-4 py-3 text-xs font-bold uppercase tracking-wide text-secondary-foreground ${getTextAlignClass(column.align)}`}
                            style={{ width: getColumnMinWidth(column), minWidth: getColumnMinWidth(column), maxWidth: getColumnMinWidth(column), height: HEADER_HEIGHT }}
                        >
                            <div className={`flex items-center gap-1 ${getHeaderJustifyClass(column.align)}`}>
                                <span>{getColumnLabel(column)}</span>
                                {isTrueValue(column?.isRequired ?? column?.required) && <span className="text-danger">*</span>}
                            </div>
                        </th>
                    ))}
                </tr>
            </thead>
        </table>
    );

    return (
        <div className="w-full max-w-full min-w-0 text-card-foreground">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <h3 className="text-md font-bold text-card-foreground">{bodyTitle}</h3>

                {!isView && isAddButton && (
                    <button type="button" onClick={onAddRow} className="flex items-center gap-2 rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 active:scale-[0.98]">
                        <Plus size={16} />
                        {addButtonText}
                    </button>
                )}
            </div>

            <div className="w-full max-w-full overflow-hidden rounded-md border border-border bg-card shadow-sm">
                <div className="relative overflow-y-auto overflow-x-hidden" style={{ maxHeight: TABLE_MAX_HEIGHT }}>
                    {/* STICKY HEADER */}
                    <div
                        className="sticky top-0 z-[50] grid w-full bg-card"
                        style={{ gridTemplateColumns: isView ? `${LEFT_WIDTH} minmax(0, 1fr)` : `${LEFT_WIDTH} minmax(0, 1fr) ${ACTION_WIDTH}` }}
                    >
                        <div className="flex items-center justify-center border-b border-r border-border bg-secondary px-3 text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground" style={{ height: HEADER_HEIGHT }}>
                            #
                        </div>

                        <div ref={centerHeaderRef} className="min-w-0 overflow-hidden bg-secondary">
                            {renderHeaderTable()}
                        </div>

                        {!isView && (
                            <div className="flex items-center justify-center border-b border-l border-border bg-secondary px-3 text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground" style={{ height: HEADER_HEIGHT }}>
                                Action
                            </div>
                        )}
                    </div>

                    {/* SCROLLABLE BODY */}
                    <div
                        className="grid w-full"
                        style={{ gridTemplateColumns: isView ? `${LEFT_WIDTH} minmax(0, 1fr)` : `${LEFT_WIDTH} minmax(0, 1fr) ${ACTION_WIDTH}` }}
                    >
                        <div className="relative z-[20] border-r border-border bg-card">
                            {!rows.length ? (
                                <div className="border-b border-border bg-card" style={{ minHeight: "120px" }} />
                            ) : (
                                rows.map((row, rowIndex) => (
                                    <div key={row.id || rowIndex} className="flex items-center justify-center border-b border-border bg-card px-3 text-center text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted" style={{ minHeight: ROW_HEIGHT }}>
                                        {rowIndex + 1}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="min-w-0 overflow-x-auto overflow-y-hidden" onScroll={handleHorizontalScroll}>
                            <table className="w-max min-w-full table-fixed border-separate border-spacing-0 text-sm">
                                <colgroup>
                                    {visibleColumns.map((column) => <col key={column.key} style={{ width: getColumnMinWidth(column) }} />)}
                                </colgroup>
                                <tbody>
                                    {!rows.length ? (
                                        <tr>
                                            <td colSpan={Math.max(visibleColumns.length, 1)} className="bg-card px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">#</div>
                                                    <p className="text-sm font-semibold text-card-foreground">No rows found</p>
                                                    <p className="text-xs text-muted-foreground">{emptyText}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row, rowIndex) => (
                                            <tr key={row.id || rowIndex} className="group transition-colors hover:bg-muted">
                                                {visibleColumns.map((column) => {
                                                    const showCell = isCellVisible ? isCellVisible(column, row, rowIndex) : true;
                                                    const calculatedField = column.key === "taxGross" || column.key === "nonTaxGross";
                                                    const disabledCell = isView || isTrueValue(isCellDisabled?.(column, row, rowIndex)) || isTrueValue(column.disabled) || isTrueValue(column.isReadonly) || calculatedField;
                                                    const cellValue = getCellValue(row, column);
                                                    const selectOptions = normalizeOptions(column);

                                                    return (
                                                        <td
                                                            key={column.key}
                                                            className="border-b border-r border-border bg-card px-3 py-3 transition-colors group-hover:bg-muted"
                                                            style={{ width: getColumnMinWidth(column), minWidth: getColumnMinWidth(column), maxWidth: getColumnMinWidth(column), height: ROW_HEIGHT }}
                                                        >
                                                            {!showCell ? (
                                                                <div className="flex min-h-[42px] items-center justify-center text-muted-foreground">—</div>
                                                            ) : (
                                                                <div className="relative min-w-0">
                                                                    {isSelectColumn(column) ? (
                                                                        typeof column.onCreateOption === "function" && !isCustomMasterColumn(column) && !isStandardMasterColumn(column) ? (
                                                                            <CreatableSelectInput
                                                                                label=""
                                                                                value={cellValue}
                                                                                placeholder={column.placeholder || `Select ${getColumnLabel(column)}`}
                                                                                error={errors?.[`row_${rowIndex}_${column.key}`]}
                                                                                disabled={disabledCell}
                                                                                largeData={column.largeData ?? true}
                                                                                showCreateOnEmpty={column.showCreateOnEmpty ?? true}
                                                                                createOptionLabel={column.createOptionLabel}
                                                                                onCreateOption={(searchValue) => column.onCreateOption?.(searchValue, rowIndex, row)}
                                                                                onChange={(event: any) => onChange(rowIndex, column.key, event?.target?.value)}
                                                                                options={selectOptions}
                                                                            />
                                                                        ) : (
                                                                            <SelectInput
                                                                                label=""
                                                                                mandatory={false}
                                                                                value={cellValue}
                                                                                placeholder={column.placeholder || `Select ${getColumnLabel(column)}`}
                                                                                error={errors?.[`row_${rowIndex}_${column.key}`]}
                                                                                disabled={disabledCell}
                                                                                largeData={isCustomMasterColumn(column) || isStandardMasterColumn(column) ? true : column.largeData}
                                                                                onChange={(event: any) => onChange(rowIndex, column.key, event?.target?.value)}
                                                                                options={[{ label: column.placeholder || `Select ${getColumnLabel(column)}`, value: "" }, ...selectOptions]}
                                                                            />
                                                                        )
                                                                    ) : (
                                                                        <TextInput
                                                                            label=""
                                                                            mandatory={false}
                                                                            type={column.type === "number" || column.key === "nonTaxRate" || calculatedField ? "number" : column.type === "date" ? "date" : "text"}
                                                                            value={column.type === "date" && cellValue ? String(cellValue).split("T")[0] : cellValue}
                                                                            placeholder={column.placeholder || getColumnLabel(column)}
                                                                            error={errors?.[`row_${rowIndex}_${column.key}`]}
                                                                            disabled={disabledCell}
                                                                            onKeyDown={(event: any) => {
                                                                                const isNumberField = column.type === "number" || column.key === "nonTaxRate" || calculatedField;
                                                                                if (isNumberField && String(cellValue ?? "") === "0" && /^[1-9]$/.test(event.key)) {
                                                                                    event.preventDefault();
                                                                                    onChange(rowIndex, column.key, event.key);
                                                                                }
                                                                            }}
                                                                            onChange={(event: any) => onChange(rowIndex, column.key, event.target.value)}
                                                                        />
                                                                    )}

                                                                    {renderCellExtra?.(column, row, rowIndex)}
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
                            <div className="relative z-[20] border-l border-border bg-card">
                                {!rows.length ? (
                                    <div className="border-b border-border bg-card" style={{ minHeight: "120px" }} />
                                ) : (
                                    rows.map((row, rowIndex) => (
                                        <div key={row.id || rowIndex} className="flex items-center justify-center border-b border-border bg-card px-3 py-3 transition-colors hover:bg-muted" style={{ minHeight: ROW_HEIGHT }}>
                                            <div className="flex w-full items-center justify-center gap-2">
                                                {isRefrenceAction && onRefrenceRow && (
                                                    <button type="button" onClick={() => onRefrenceRow(rowIndex, row)} className="flex h-8 items-center justify-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 text-xs font-semibold text-primary transition hover:bg-primary/20" title={getReferenceButtonText(row, rowIndex)}>
                                                        {getReferenceIcon(row)}
                                                    </button>
                                                )}

                                                {(!isRowDeleteVisible || isRowDeleteVisible(row, rowIndex)) && (
                                                    <button type="button" onClick={() => onDeleteRow(rowIndex)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-danger/20 bg-danger/10 text-danger transition hover:border-danger/30 hover:bg-danger/20 active:scale-[0.96]" title="Delete" aria-label={`Delete row ${rowIndex + 1}`}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
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
    if (normalizedType === "custommaster") return "custommaster";
    if (normalizedType === "accountmaster") return "accountmaster";
    if (normalizedType === "productmaster") return "productmaster";
    if (normalizedType === "unitmaster") return "unitmaster";
    if (normalizedType === "employeemaster") return "employeemaster";

    return "text";
};

const normalizeReadonlyColumns = (fields: any[]) => {
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
    const invoiceFields = useMemo(() => getInvoiceHeaderSchema(schema), [schema]);
    const productFields = useMemo(() => getProductSchema(schema), [schema]);

    const columns = useMemo(() => {
        return normalizeReadonlyColumns([...invoiceFields, ...productFields]);
    }, [invoiceFields, productFields]);

    const rows = useMemo(() => { 
        const flattenedRows: any[] = [];
 
        (invoices || []).forEach((invoice: any, invoiceIndex: number) => {
            const products = Array.isArray(invoice?.sInvBody) ? invoice.sInvBody : [];
            const invoiceNumber = invoice?.sInvNo || invoice?.sInvVoucherNumber || invoice?.sOrderVoucherNumber || `Invoice ${invoiceIndex + 1}`;

            if (!products.length) {
                flattenedRows.push({
                    ...invoice,
                    id: `${invoiceNumber}-0`,
                    __invoiceIndex: invoiceIndex,
                    __productIndex: 0,
                });
                return;
            }
 
            products.forEach((product: any, productIndex: number) => {
                flattenedRows.push({
                    ...invoice,
                    ...product,
                    id: `${invoiceNumber}-${productIndex}`,
                    __invoiceIndex: invoiceIndex,
                    __productIndex: productIndex,
                });
            });
        });
 
        return flattenedRows;
    }, [invoices]);

    const handleRowDelete = (rowIndex: number) => {
        const invoiceIndex = rows?.[rowIndex]?.__invoiceIndex;
        if (invoiceIndex === undefined || invoiceIndex === null) return;
        onDeleteInvoice?.(invoiceIndex);
    };

    const handleRowChange = (rowIndex: number, key: string, value: any) => {
        const invoiceIndex = rows?.[rowIndex]?.__invoiceIndex;
        if (invoiceIndex === undefined || invoiceIndex === null) return;
        onInvoiceChange?.(invoiceIndex, key, value);
    };

    return (
        <EditableLineTable
            bodyTitle={title}
            isView={!showDelete}
            rows={rows}
            columns={columns}
            errors={errors}
            onAddRow={() => { }}
            onDeleteRow={handleRowDelete}
            onRefrenceRow={() => { }}
            onChange={handleRowChange}
            emptyText="No Sales Invoice selected"
            isAddButton={false}
            isRefrenceAction={false}
            isRowDeleteVisible={(row: any) => row?.__productIndex === 0}
            isCellDisabled={() => readonly}
        />
    );
};

export { MultiInvoiceEditableTable }
export default EditableLineTable;