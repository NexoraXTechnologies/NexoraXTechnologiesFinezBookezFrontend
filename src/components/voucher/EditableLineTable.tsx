import { Plus, Trash2 } from "lucide-react";
import { SelectInput, TextInput } from "../inputs";
import { capitalizeFirstLttr } from "../../utils/templateKeyLabel";

type ColumnType = "select" | "text" | "number";

export type EditableColumn = {
    key: string;
    title: string;
    type: ColumnType;
    width?: string;
    placeholder?: string;
    options?: any[];
    required?: boolean;
    disabled?: boolean;
    align?: "left" | "right" | "center";
};

type EditableLineTableProps = {
    title: string;
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
}

const EditableLineTable = ({
    title,
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



    return (
        <div className="w-full max-w-full">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-semibold text-slate-800">
                    {title}
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

            {/* ✅ Only this section will scroll horizontally */}
            {/* <div className="w-full max-w-full overflow-x-auto overflow-y-hidden border border-slate-200">
                <table className="w-max min-w-[1100px] border-collapse text-sm"> */}

            <div className="w-full max-w-full min-w-0 overflow-hidden border border-slate-200">
                <div className="w-full overflow-x-auto overflow-y-hidden">
                    <table className="w-max min-w-[1100px] border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-300 text-black">
                                <th className="w-[50px] border border-slate-500 px-3 py-2 text-left">
                                    #
                                </th>

                                {columns.map((col: any) => (
                                    <th
                                        key={col.key}
                                        className={`border border-slate-500 px-3 py-2 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                                        style={{ minWidth: col.width || "160px", }}
                                    >

                                        {col?.label || capitalizeFirstLttr(col?.key)}
                                        {col.isRequired && (
                                            <span className="text-red-500">*</span>
                                        )}
                                    </th>
                                ))}

                                <th className="border border-slate-500 px-3 py-2 text-center">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length + 2}
                                        className="border border-slate-200 px-3 py-10 text-center text-slate-500"
                                    >
                                        {emptyText}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, rowIndex) => (
                                    <tr
                                        key={row.id || rowIndex}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="border border-slate-200 px-3 py-2">
                                            {rowIndex + 1}
                                        </td>

                                        {columns.map((col: any) => (
                                            <td
                                                key={col.key}
                                                className="border border-slate-200 px-2 py-1"
                                                style={{
                                                    minWidth: col.width || "160px",
                                                }}
                                            >
                                                {col.type === "select" ? (
                                                    <SelectInput
                                                        label=""
                                                        mandatory={false}
                                                        value={row[col.key] || ""}
                                                        placeholder={
                                                            col.placeholder ||
                                                            `Select ${col.title}`
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
                                                                    `Select ${col?.label}`,
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
                                                            col.title
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
                                            </td>
                                        ))}

                                        {/* <td className="border border-slate-200 px-3 py-2 text-center">

                                            {isRefrenceAction && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onDeleteRow(rowIndex)
                                                    }
                                                    className="text-red-500 hover:text-red-700 "
                                                >
                                                    <Plus size={16} />{RefrenceBtnText}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onDeleteRow(rowIndex)
                                                }
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </button>



                                        </td> */}


                                        <td className="border border-slate-200 px-3 py-2">
                                            <div className="flex items-center justify-center gap-2">
                                                {isRefrenceAction && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onRefrenceRow(rowIndex, row)}
                                                        className="
                                                                inline-flex min-w-[105px] items-center justify-center gap-1.5 rounded-lg
                                                                border border-blue-200 bg-blue-50 px-2.5 py-1.5
                                                                font-semibold text-blue-600
                                                                transition hover:bg-blue-100 hover:text-blue-700
                                                            "
                                                        style={{ fontSize: "9px" }}
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
                                                        inline-flex h-8 w-8 items-center justify-center rounded-lg
                                                        border border-red-200 bg-red-50
                                                        text-red-500 transition
                                                        hover:bg-red-100 hover:text-red-700
                                                    "
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default EditableLineTable;