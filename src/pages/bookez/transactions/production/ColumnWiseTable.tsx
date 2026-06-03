import React from "react";

export type ColumnWiseField<T = any> = {
    label: string;
    key: keyof T | string;
    render?: (item: T, index: number) => React.ReactNode;
};

type ColumnWiseTableProps<T = any> = {
    data: T[];
    fields: ColumnWiseField<T>[];
    showRecordNumber?: boolean;
    emptyMessage?: string;
    onEdit?: (item: T, index: number) => void;
    onDelete?: (item: T, index: number) => void;
};

const leftHeaderClass =
    "sticky left-0 z-20 min-w-[180px] border-r border-b border-slate-200 bg-slate-100 px-4 py-3 text-center font-bold text-slate-900 shadow-[1px_0_0_0_#e2e8f0]";

const leftBodyClass =
    "sticky left-0 z-20 min-w-[180px] border-r border-b border-slate-200 bg-white px-4 py-3 text-center font-semibold text-slate-700 shadow-[1px_0_0_0_#e2e8f0]";

const valueHeaderClass =
    "min-w-[220px] border-r border-b border-slate-200 bg-slate-100 px-4 py-3 text-center font-bold text-slate-900";

const valueBodyClass =
    "min-w-[220px] border-r border-b border-slate-200 bg-white px-4 py-3 text-center text-slate-900";

const ColumnWiseTable = <T extends Record<string, any>>({
    data = [],
    fields = [],
    showRecordNumber = true,
    emptyMessage = "No data",
    onEdit,
    onDelete,
}: ColumnWiseTableProps<T>) => {
    if (!data || data.length === 0) {
        return (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
                <tbody>
                    {showRecordNumber && (
                        <tr>
                            <td className={leftHeaderClass}>
                                No of Records
                            </td>

                            {data.map((_: T, index: number) => (
                                <td
                                    key={`record-${index}`}
                                    className={valueHeaderClass}
                                >
                                    {index + 1}
                                </td>
                            ))}
                        </tr>
                    )}

                    {fields.map((field) => (
                        <tr key={String(field.key)}>
                            <td className={leftBodyClass}>
                                {field.label}
                            </td>

                            {data.map((item: T, index: number) => (
                                <td
                                    key={`${String(field.key)}-${index}`}
                                    className={valueBodyClass}
                                >
                                    {field.render
                                        ? field.render(item, index)
                                        : item?.[field.key as keyof T] || "-"}
                                </td>
                            ))}
                        </tr>
                    ))}

                    {(onEdit || onDelete) && (
                        <tr>
                            <td className={leftHeaderClass}>
                                Actions
                            </td>

                            {data.map((item: T, index: number) => (
                                <td
                                    key={`actions-${index}`}
                                    className={valueBodyClass}
                                >
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={() => onEdit(item, index)}
                                            className="font-semibold text-indigo-700 hover:text-indigo-900"
                                        >
                                            Edit
                                        </button>
                                    )}

                                    {onEdit && onDelete && (
                                        <span className="mx-2 text-slate-300">
                                            |
                                        </span>
                                    )}

                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={() => onDelete(item, index)}
                                            className="font-semibold text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            ))}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ColumnWiseTable;