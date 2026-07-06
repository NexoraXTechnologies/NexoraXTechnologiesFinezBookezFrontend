import { Plus, Trash2 } from "lucide-react";
import { SelectInput, TextInput } from "../inputs";
import { capitalizeFirstLttr } from "../../utils/templateKeyLabel";
import { AnimatePresence, motion } from "framer-motion";

type ColumnType = "select" | "text" | "number";

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
    align?: "left" | "right" | "center";
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
    onRefrenceRow: (index: number, row?: any) => void;
    RefrenceBtnText?: string | ((row: any, index: number) => string);
    onChange: (index: number, key: string, value: any) => void;
    emptyText?: string;
    isRefrenceAction: boolean;
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
}: EditableLineTableProps) => {
    const getReferenceButtonText = (row: any, rowIndex: number) => {
        if (typeof RefrenceBtnText === "function") {
            return RefrenceBtnText(row, rowIndex);
        }

        if (RefrenceBtnText) {
            return RefrenceBtnText;
        }

        return Array.isArray(row?.references) && row.references.length > 0
            ? "Edit Reference"
            : "Add Reference";
    };

    const getColumnLabel = (col: EditableColumn) => {
        return col?.label || col?.title || capitalizeFirstLttr(col?.key);
    };

    const getColumnMinWidth = (col: EditableColumn) => {
        return col?.width || "220px";
    };

    const getTextAlignClass = (align?: "left" | "right" | "center") => {
        if (align === "right") return "text-right";
        if (align === "center") return "text-center";
        return "text-left";
    };

    const getHeaderJustifyClass = (align?: "left" | "right" | "center") => {
        if (align === "right") return "justify-end";
        if (align === "center") return "justify-center";
        return "justify-start";
    };

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
                        className="
                            flex items-center gap-2
                            rounded border border-primary
                            px-4 py-2
                            text-sm font-semibold text-primary
                            transition
                            hover:bg-primary/10
                            active:scale-[0.98]
                        "
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
                    {/* LEFT FIXED INDEX COLUMN */}
                    <div className="relative z-[30] border-r border-border bg-card">
                        <div
                            className="
                                flex items-center justify-center
                                border-b border-border bg-secondary
                                px-3 text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground
                            "
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
                            <AnimatePresence initial={false}>
                                {rows.map((row, rowIndex) => (
                                    <motion.div
                                        key={row.id || rowIndex}
                                        layout
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{
                                            duration: 0.16,
                                            ease: "easeOut",
                                        }}
                                        className="
                                            flex items-center justify-center
                                            border-b border-border bg-card
                                            px-3 text-center text-sm font-semibold text-muted-foreground
                                            transition-colors
                                            hover:bg-muted
                                        "
                                        style={{ minHeight: ROW_HEIGHT }}
                                    >
                                        {rowIndex + 1}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* CENTER SCROLLABLE TABLE */}
                    <div className="min-w-0 overflow-x-auto overflow-y-hidden">
                        <table
                            className="w-max min-w-full border-separate border-spacing-0 text-sm"
                            style={{ tableLayout: "auto" }}
                        >
                            <thead>
                                <tr>
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className={`
                                                bg-secondary
                                                border-b border-r border-border
                                                px-4 py-3
                                                text-xs font-bold uppercase tracking-wide text-secondary-foreground
                                                ${getTextAlignClass(col.align)}
                                            `}
                                            style={{
                                                minWidth: getColumnMinWidth(col),
                                                height: HEADER_HEIGHT,
                                            }}
                                        >
                                            <div
                                                className={`
                                                    flex items-center gap-1
                                                    ${getHeaderJustifyClass(col.align)}
                                                `}
                                            >
                                                <span>{getColumnLabel(col)}</span>

                                                {(col.isRequired || col.required) && (
                                                    <span className="text-danger">*</span>
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
                                            colSpan={columns.length}
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
                                    <AnimatePresence initial={false}>
                                        {rows.map((row, rowIndex) => (
                                            <motion.tr
                                                key={row.id || rowIndex}
                                                layout
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{
                                                    duration: 0.16,
                                                    ease: "easeOut",
                                                }}
                                                className="group transition-colors hover:bg-muted"
                                            >
                                                {columns.map((col) => (
                                                    <motion.td
                                                        layout
                                                        key={col.key}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{
                                                            duration: 0.14,
                                                            ease: "easeOut",
                                                        }}
                                                        className="
                                                            bg-card
                                                            border-b border-r border-border
                                                            px-3 py-3
                                                            transition-colors
                                                            group-hover:bg-muted
                                                        "
                                                        style={{
                                                            minWidth: getColumnMinWidth(col),
                                                            height: ROW_HEIGHT,
                                                        }}
                                                    >
                                                        <div className="min-w-0">
                                                            {col.type === "select" ? (
                                                                <SelectInput
                                                                    label=""
                                                                    mandatory={false}
                                                                    value={row[col.key] || ""}
                                                                    placeholder={
                                                                        col.placeholder ||
                                                                        `Select ${getColumnLabel(col)}`
                                                                    }
                                                                    error={
                                                                        errors?.[
                                                                        `row_${rowIndex}_${col.key}`
                                                                        ]
                                                                    }
                                                                    disabled={col.disabled}
                                                                    onChange={(e: any) =>
                                                                        onChange(
                                                                            rowIndex,
                                                                            col.key,
                                                                            e?.target?.value
                                                                        )
                                                                    }
                                                                    options={[
                                                                        {
                                                                            label:
                                                                                col.placeholder ||
                                                                                `Select ${getColumnLabel(col)}`,
                                                                            value: "",
                                                                        },
                                                                        ...(col.options || []),
                                                                    ]}
                                                                />
                                                            ) : (
                                                                <TextInput
                                                                    label=""
                                                                    mandatory={false}
                                                                    type={
                                                                        col.type === "number"
                                                                            ? "number"
                                                                            : "text"
                                                                    }
                                                                    value={row[col.key] || ""}
                                                                    placeholder={
                                                                        col.placeholder ||
                                                                        getColumnLabel(col)
                                                                    }
                                                                    error={
                                                                        errors?.[
                                                                        `row_${rowIndex}_${col.key}`
                                                                        ]
                                                                    }
                                                                    disabled={col.disabled}
                                                                    onChange={(e: any) =>
                                                                        onChange(
                                                                            rowIndex,
                                                                            col.key,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                />
                                                            )}
                                                        </div>
                                                    </motion.td>
                                                ))}
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* RIGHT FIXED ACTION COLUMN */}
                    {!isView && (
                        <div className="relative z-[30] border-l border-border bg-card">
                            <div
                                className="
                                    flex items-center justify-center
                                    border-b border-border bg-secondary
                                    px-3 text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground
                                "
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
                                <AnimatePresence initial={false}>
                                    {rows.map((row, rowIndex) => (
                                        <motion.div
                                            key={row.id || rowIndex}
                                            layout
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{
                                                duration: 0.16,
                                                ease: "easeOut",
                                            }}
                                            className="
                                                flex items-center justify-center
                                                border-b border-border bg-card
                                                px-3 py-3
                                                transition-colors
                                                hover:bg-muted
                                            "
                                            style={{ minHeight: ROW_HEIGHT }}
                                        >
                                            <div className="flex w-full items-center justify-center gap-2">
                                                {isRefrenceAction && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onRefrenceRow(rowIndex, row)
                                                        }
                                                        className="
                                                            inline-flex items-center justify-center gap-1.5
                                                            rounded-lg
                                                            border border-primary/20
                                                            bg-primary/10
                                                            px-3 py-1.5
                                                            text-xs font-semibold text-primary
                                                            transition
                                                            hover:border-primary/30 hover:bg-primary/20 hover:text-primary
                                                            active:scale-[0.98]
                                                        "
                                                    >
                                                        <Plus size={14} />

                                                        <span className="whitespace-nowrap">
                                                            {getReferenceButtonText(
                                                                row,
                                                                rowIndex
                                                            )}
                                                        </span>
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteRow(rowIndex)}
                                                    className="
                                                        inline-flex h-8 w-8 items-center justify-center
                                                        rounded-lg
                                                        border border-danger/20
                                                        bg-danger/10
                                                        text-danger
                                                        transition
                                                        hover:border-danger/30 hover:bg-danger/20 hover:text-danger
                                                        active:scale-[0.96]
                                                    "
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditableLineTable;