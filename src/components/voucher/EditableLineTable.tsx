import { Edit, Plus, Trash2 } from "lucide-react";
import { CreatableSelectInput, SelectInput, TextInput } from "../inputs";

import { capitalizeFirstLttr } from "../../utils/templateKeyLabel";

type ColumnType = "select" | "text" | "number" | "date";

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
    disabled?: boolean;
    isReadonly?: boolean;
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

                                                {(column.isRequired ||
                                                    column.required) && (
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
                                                    Boolean(
                                                        isCellDisabled?.(
                                                            column,
                                                            row,
                                                            rowIndex
                                                        )
                                                    ) ||
                                                    Boolean(
                                                        column.disabled ||
                                                        column.isReadonly
                                                    ) ||
                                                    calculatedField;

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
                                                            <div className="min-w-0">
                                                                {column.type ===
                                                                    "select" ? (
                                                                    typeof column.onCreateOption ===
                                                                        "function" ? (
                                                                        <CreatableSelectInput
                                                                            label=""
                                                                            value={
                                                                                row?.[
                                                                                column
                                                                                    .key
                                                                                ] ??
                                                                                ""
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
                                                                                column.options ||
                                                                                []
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <SelectInput
                                                                            label=""
                                                                            mandatory={
                                                                                false
                                                                            }
                                                                            value={
                                                                                row?.[
                                                                                column
                                                                                    .key
                                                                                ] ??
                                                                                ""
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
                                                                                ...(column.options ||
                                                                                    []),
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
                                                                            row?.[
                                                                            column
                                                                                .key
                                                                            ] ??
                                                                            ""
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
                                                                        onChange={(
                                                                            event: any
                                                                        ) =>
                                                                            onChange(
                                                                                rowIndex,
                                                                                column.key,
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                    />
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
                                                aria-label={`Delete row ${rowIndex + 1
                                                    }`}
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

export default EditableLineTable;