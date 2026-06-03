import React from "react";
import ReadMoreText from "./common/ReadMoreText";

type Column<T> = {
  key: keyof T | string;
  title: string;
  type?: "date" | "readMoreText";
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
};

export default function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "No data found",
  actions,
}: DataTableProps<T>) {
  return (
    <div className="min-h-0 flex-1 w-full">
      <div
        id="account-table-container"
        className="
          h-full min-h-0 overflow-auto
          rounded-md border border-gray-200
          bg-white shadow-sm
        "
      >
        <table className="min-w-[900px] w-full text-sm text-gray-700 border-separate border-spacing-0">
          {/* HEADER */}
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              {columns?.map((col) => (
                <th
                  key={String(col.key)}
                  className={`
                    px-4 py-4
                    border-b border-gray-200
                    text-left font-semibold text-gray-600
                    bg-gray-50 whitespace-nowrap
                    ${col.className || ""}
                  `}
                >
                  {col.title}
                </th>
              ))}

              {actions && (
                <th className=" px-4 py-4 border-b border-gray-200 text-left font-semibold text-gray-600 bg-gray-50 whitespace-nowrap w-[120px]"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns?.length + (actions ? 1 : 0)}
                  className="text-center py-10 text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data?.length ? (
              data?.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-indigo-50/40 transition-all duration-200">
                  {columns?.map((col) => {
                    const value = row?.[col?.key as keyof T];
                    return (
                      <td
                        key={String(col.key)}
                        className="px-4 py-3 border-b border-gray-200 font-medium text-gray-800 whitespace-nowrap">
                        {col.type === "date" ? (
                          value ? (
                            new Date(value as any).toLocaleString()
                          ) : (
                            "—"
                          )
                        ) : col.type === "readMoreText" ? (
                          <ReadMoreText text={(value as string) || "—"} charLimit={20} />
                        ) : col.render ? (
                          col.render(row)
                        ) : (
                          (value as React.ReactNode) || "—"
                        )}
                      </td>
                    );
                  })}

                  {actions && (
                    <td className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center py-10 text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export type ColumnWiseField<T = any> = {
    title: string;
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
                          {field.title}
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

export {ColumnWiseTable};