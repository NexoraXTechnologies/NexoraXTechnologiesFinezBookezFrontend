import ReadMoreText from "./common/ReadMoreText";

type Column<T> = {
    key: keyof T | string;
    title: string;
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
    emptyMessage = 'No data found',
    actions,
}: DataTableProps<T>) {
    return (
        <div className="flex-1 w-full ">
            <div id="account-table-container" className="max-h-[78vh] overflow-auto rounded-md border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full text-sm text-gray-700 border-separate border-spacing-0 pb-[2rem]">
                    {/* HEADER */}
                    <thead className="sticky top-0 z-10 bg-white border-b border-gray-200">
                        <tr>
                            {columns.map((col) => (
                                <th key={String(col.key)} className={`px-4 border-b border-gray-200 py-4 text-left font-semibold text-gray-600 w-[150px] bg-gray-50 ${col.className || ''}`}>
                                    {col.title}
                                </th>
                            ))}

                            {actions && (
                                <th className="px-4 py-4 border-b border-gray-200 text-left font-semibold text-gray-600 w-[120px] bg-gray-50">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    {/* BODY */}
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-10 text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading accounts...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length ? (data.map((row, index) => (
                            <tr
                                key={index}
                                className="hover:bg-indigo-50/40 transition-all duration-200">
                                {columns.map((col) => (
                                    <td key={String(col.key)} className="px-4 py-3 border-b border-gray-200 font-medium text-gray-800">
                                        {(col?.type == "date") ? new Date(row[col.key as keyof T]).toLocaleString() : ((col?.type == "readMoreText") ? <ReadMoreText text={row[col.key as keyof T] || '—'} charLimit={20} /> : col.render ? col.render(row) : row[col.key as keyof T])}
                                    </td>
                                ))}

                                {actions && (
                                    <td className="px-4 py-3 border-b border-gray-200">
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