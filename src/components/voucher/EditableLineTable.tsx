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

    return (
        <div className="w-full max-w-full min-w-0 text-card-foreground">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <h3 className="text-md font-bold text-card-foreground">
                    {bodyTitle}
                </h3>

                {isView ? (
                    <></>
                ) : (
                    <>
                        {isAddButton && (
                            <button
                                type="button"
                                onClick={onAddRow}
                                className="flex items-center gap-2 rounded border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                            >
                                <Plus size={16} />
                                {addButtonText}
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="relative w-full max-w-full overflow-hidden rounded-md border border-border bg-card shadow-sm">
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
                    bg-secondary
                    border-b border-r border-border
                    px-4 py-3
                    text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground
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
                      bg-secondary
                      border-b border-r border-border
                      px-4 py-3
                      text-xs font-bold uppercase tracking-wide text-secondary-foreground
                      ${getTextAlignClass(col.align)}
                    `}
                                        style={{
                                            minWidth: getColumnMinWidth(col),
                                        }}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>{getColumnLabel(col)}</span>

                                            {(col.isRequired || col.required) && (
                                                <span className="text-danger">*</span>
                                            )}
                                        </div>
                                    </th>
                                ))}

                                {/* RIGHT STICKY HEADER */}
                                {isView ? (
                                    <></>
                                ) : (
                                    <th
                                        className="
                      sticky right-0 top-0 z-[80]
                      w-auto whitespace-nowrap
                      bg-secondary
                      border-b border-l border-border
                      px-4 py-3
                      text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground
                    "
                                    >
                                        Action
                                    </th>
                                )}
                            </tr>
                        </thead>

                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + 2}
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
                        hover:bg-muted
                      "
                                        >
                                            {/* LEFT STICKY BODY CELL */}
                                            <motion.td
                                                layout
                                                className="
                          sticky left-0 z-[50]
                          w-[58px] min-w-[58px]
                          bg-card
                          border-b border-r border-border
                          px-4 py-3
                          text-center text-sm font-semibold text-muted-foreground
                          transition-colors
                          group-hover:bg-muted
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
                            bg-card
                            border-b border-r border-border
                            px-3
                            transition-colors
                            group-hover:bg-muted
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
                                                                error={errors?.[`row_${rowIndex}_${col.key}`]}
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
                                                                type={col.type === "number" ? "number" : "text"}
                                                                value={row[col.key] || ""}
                                                                placeholder={
                                                                    col.placeholder || getColumnLabel(col)
                                                                }
                                                                error={errors?.[`row_${rowIndex}_${col.key}`]}
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
                                            {isView ? (
                                                <></>
                                            ) : (
                                                <motion.td
                                                    layout
                                                    className="
                            sticky right-0 z-[50]
                            w-auto whitespace-nowrap
                            bg-card
                            border-b border-l border-border
                            px-4 py-3
                            text-center
                            transition-colors
                            group-hover:bg-muted
                          "
                                                >
                                                    <div className="flex w-max items-center justify-center gap-2">
                                                        {isRefrenceAction && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onRefrenceRow(rowIndex, row)}
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
                                                                    {getReferenceButtonText(row, rowIndex)}
                                                                </span>
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => onDeleteRow(rowIndex)}
                                                            className="
                                inline-flex h-7 w-7 items-center justify-center
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
                                                </motion.td>
                                            )}
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