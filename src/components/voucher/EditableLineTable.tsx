import { Plus, Trash2 } from "lucide-react";
import { SelectInput, TextInput } from "../inputs";
import { capitalizeFirstLttr } from "../../utils/templateKeyLabel";
import { AnimatePresence, motion } from "framer-motion"
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

const EditableLineTable = ({
    bodyTitle,
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



    return (
        <div className="w-full max-w-full min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <h3 className="text-md font-bold text-slate-800">
                    {bodyTitle}
                </h3>

                {isAddButton && (
                    <button
                        type="button"
                        onClick={onAddRow}
                        className="flex items-center gap-2 rounded border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                    >
                        <Plus size={16} />
                        {addButtonText}
                    </button>
                )}
            </div>
            <div className="relative w-full max-w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                <div className="w-full max-w-full overflow-x-auto overflow-y-hidden">
                    <table
                        className="w-full min-w-full border-separate border-spacing-0 text-sm"
                        style={{
                            tableLayout: "auto",
                        }}
                    >
                        <thead>
                            <tr>
                                {/* LEFT STICKY HEADER */}
                                <th
                                    className="
                            sticky left-0 top-0 z-[80]
                            w-[58px] min-w-[58px]
                            bg-slate-100
                            border-b border-r border-slate-200
                            px-4 py-3
                            text-center text-xs font-bold uppercase tracking-wide text-slate-700
                        "
                                >
                                    #
                                </th>

                                {/* DYNAMIC HEADERS */}
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`
                                sticky top-0 z-[40]
                                bg-slate-100
                                border-b border-r border-slate-200
                                px-4 py-3
                                text-xs font-bold uppercase tracking-wide text-slate-700
                                ${getTextAlignClass(col.align)}
                            `}
                                        style={{
                                            minWidth: getColumnMinWidth(col),
                                        }}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>{getColumnLabel(col)}</span>

                                            {(col.isRequired || col.required) && (
                                                <span className="text-red-500">*</span>
                                            )}
                                        </div>
                                    </th>
                                ))}

                                {/* RIGHT STICKY HEADER */}
                                <th
                                    className="
                                    sticky right-0 top-0 z-[80]
                                    w-auto whitespace-nowrap
                                    bg-slate-100
                                    border-b border-l border-slate-200
                                    px-4 py-3
                                    text-center text-xs font-bold uppercase tracking-wide text-slate-700
                                "
                                >
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + 2}
                                        className="bg-white px-6 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                #
                                            </div>

                                            <p className="text-sm font-semibold text-slate-700">
                                                No rows found
                                            </p>

                                            <p className="text-xs text-slate-500">
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
                                            initial={{
                                                opacity: 0,
                                                y: 4,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -4,
                                            }}
                                            transition={{
                                                duration: 0.16,
                                                ease: "easeOut",
                                            }}
                                            className="
                                                    group
                                                    transition-colors
                                                    hover:bg-slate-50
                                                "
                                        >
                                            {/* LEFT STICKY BODY CELL */}
                                            <motion.td
                                                layout
                                                className="
                                                    sticky left-0 z-[50]
                                                    w-[58px] min-w-[58px]
                                                    bg-white
                                                    border-b border-r border-slate-200
                                                    px-4 py-3
                                                    text-center text-sm font-semibold text-slate-600
                                                    transition-colors
                                                    group-hover:bg-slate-50
                                                "
                                            >
                                                {rowIndex + 1}
                                            </motion.td>

                                            {/* DYNAMIC BODY CELLS */}
                                            {columns.map((col) => (
                                                <motion.td
                                                    layout
                                                    key={col.key}
                                                    initial={{
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                    }}
                                                    transition={{
                                                        duration: 0.14,
                                                        ease: "easeOut",
                                                    }}
                                                    className="
                                                        bg-white
                                                        border-b border-r border-slate-200
                                                        px-3
                                                        transition-colors
                                                        group-hover:bg-slate-50
                                                    "
                                                    style={{
                                                        minWidth: getColumnMinWidth(col),
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
                                                                            `Select ${getColumnLabel(
                                                                                col
                                                                            )}`,
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

                                            {/* RIGHT STICKY ACTION CELL */}
                                            <motion.td
                                                layout
                                                className="
                                                    sticky right-0 z-[50]
                                                    w-auto whitespace-nowrap
                                                    bg-white
                                                    border-b border-l border-slate-200
                                                    px-4 py-3
                                                    text-center
                                                    transition-colors
                                                    group-hover:bg-slate-50
                                                "
                                            >
                                                <div className="flex w-max items-center justify-center gap-2">
                                                    {isRefrenceAction && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onRefrenceRow(rowIndex, row)
                                                            }
                                                            className="
                                                                    inline-flex items-center justify-center gap-1.5
                                                                    rounded-lg
                                                                    border border-blue-200
                                                                    bg-blue-50
                                                                    px-3 py-1.5
                                                                    text-xs font-semibold text-blue-600
                                                                    
                                                                    transition
                                                                    hover:border-blue-300 hover:bg-blue-100 hover:text-blue-700
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
                                                    inline-flex h-7 w-7 items-center justify-center
                                                    rounded-lg
                                                    border border-red-200
                                                    bg-red-50
                                                    text-red-500
                                                    
                                                    transition
                                                    hover:border-red-300 hover:bg-red-100 hover:text-red-700
                                                    active:scale-[0.96]
                                                "
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </motion.td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EditableLineTable;