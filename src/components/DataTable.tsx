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
              {columns.map((col) => (
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
                <th
                  className="
                    px-4 py-4
                    border-b border-gray-200
                    text-left font-semibold text-gray-600
                    bg-gray-50 whitespace-nowrap
                    w-[120px]
                  "
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
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center py-10 text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data?.length ? (
              data.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-indigo-50/40 transition-all duration-200"
                >
                  {columns.map((col) => {
                    const value = row[col.key as keyof T];

                    return (
                      <td
                        key={String(col.key)}
                        className="
                          px-4 py-3
                          border-b border-gray-200
                          font-medium text-gray-800
                          whitespace-nowrap
                        "
                      >
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