import React, { useEffect, useMemo, useRef, useState } from "react";
import { Settings } from "lucide-react";
import ReadMoreText from "./common/ReadMoreText";

/* ===================================================
   COMMON FIELD SELECTOR
=================================================== */

type FieldSelectorProps = {
	columns: any[];
	visibleKeys: string[];
	setVisibleKeys: React.Dispatch<React.SetStateAction<string[]>>;
};

const FieldSelector = ({
	columns = [],
	visibleKeys,
	setVisibleKeys,
}: FieldSelectorProps) => {
	const [open, setOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement | null>(null);

	const allKeys = useMemo(
		() => columns.map((col: any) => String(col.key)),
		[columns]
	);

	const isAllSelected = visibleKeys.length === allKeys.length;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleToggleColumn = (key: string) => {
		setVisibleKeys((prev) => {
			const alreadySelected = prev.includes(key);

			if (alreadySelected) {
				// minimum one column should stay visible
				if (prev.length === 1) return prev;

				return prev.filter((item) => item !== key);
			}

			return [...prev, key];
		});
	};

	const handleSelectAll = () => {
		setVisibleKeys(allKeys);
	};

	const handleReset = () => {
		setVisibleKeys(allKeys);
	};

	return (
		<div ref={dropdownRef} className="relative flex justify-end">
			<button type="button" onClick={() => setOpen((prev) => !prev)} className={`cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all duration-200 ${open ? "border-indigo-500 bg-indigo-600 text-white shadow-indigo-100 rotate-45" : "border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"}`} title="Select Fields">
				<Settings size={18} />
			</button>

			{open && (
				<div
					className="
            absolute right-0 top-11 z-50 w-72 rounded-xl border border-gray-200
            bg-white shadow-xl
          "
				>
					<div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
						<h3 className="text-sm font-bold text-gray-800">
							Select Fields
						</h3>

						<button
							type="button"
							onClick={handleReset}
							className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
						>
							Reset
						</button>
					</div>

					<div className="border-b border-gray-100 px-4 py-3">
						<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-gray-700">
							<input
								type="checkbox"
								checked={isAllSelected}
								onChange={handleSelectAll}
								className="h-4 w-4 cursor-pointer accent-indigo-600"
							/>
							Select All
						</label>
					</div>

					<div className="max-h-72 overflow-y-auto p-2">
						{columns.map((col: any) => {
							const key = String(col.key);
							const checked = visibleKeys.includes(key);

							return (
								<label
									key={key}
									className="
                    flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2
                    text-sm font-medium text-gray-700 hover:bg-indigo-50
                  "
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={() => handleToggleColumn(key)}
										className="h-4 w-4 cursor-pointer accent-indigo-600"
									/>

									<span className="line-clamp-1">
										{col.title}
									</span>
								</label>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

/* ===================================================
   NORMAL DATA TABLE
=================================================== */

type DataTableProps<T> = {
	columns: any[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
	showFieldSelector?: boolean;
};

export default function DataTable<T>({
	columns = [],
  data,
  loading,
  emptyMessage = "No data found",
  actions,
	showFieldSelector = true,
}: DataTableProps<T>) {
	const [visibleKeys, setVisibleKeys] = useState<string[]>(
		columns.map((col: any) => String(col.key))
	);

	useEffect(() => {
		setVisibleKeys(columns.map((col: any) => String(col.key)));
	}, [columns]);

	const visibleColumns = useMemo(() => {
		return columns.filter((col: any) =>
			visibleKeys.includes(String(col.key))
		);
	}, [columns, visibleKeys]);

  return (
    <div className="min-h-0 flex-1 w-full">
		  <div className="h-full">
			  {showFieldSelector && columns.length > 0 && <div className="mb-3 flex justify-end">
				  <FieldSelector columns={columns} visibleKeys={visibleKeys} setVisibleKeys={setVisibleKeys} />
			  </div>}

			  <div id="account-table-container" className="h-full min-h-0 overflow-auto rounded-md border border-gray-200 bg-white shadow-sm">
				  <table className="min-w-[900px] w-full text-sm text-gray-700 border-separate border-spacing-0">
					  <thead className="sticky top-0 z-10 bg-gray-50">
						  <tr>
							  {visibleColumns?.map((col: any) => <th key={String(col.key)} className={`px-4 py-4 border-b border-gray-200 text-left font-semibold text-gray-600 bg-gray-50 whitespace-nowrap ${col.className || ""}`}>{col.title}</th>)}
							  {actions && <th className="px-4 py-4 border-b border-gray-200 text-left font-semibold text-gray-600 bg-gray-50 whitespace-nowrap w-[120px]">Actions</th>}
						  </tr>
					  </thead>

					  <tbody>
						  {loading ? (
							  <tr><td colSpan={visibleColumns?.length + (actions ? 1 : 0)} className="text-center py-10 text-gray-500"><div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /><span>Loading...</span></div></td></tr>
						  ) : data?.length ? (
							  data?.map((row, index) => (
								  <tr key={index} className="hover:bg-indigo-50/40 transition-all duration-200">
									  {visibleColumns?.map((col: any) => {
										  const value = row?.[col?.key as keyof T];

										  return <td key={String(col.key)} className="px-4 py-3 border-b border-gray-200 font-medium text-gray-800 whitespace-nowrap">{col.type === "date" ? (value ? new Date(value as any).toLocaleString() : "—") : col.type === "readMoreText" ? <ReadMoreText text={(value as string) || "—"} charLimit={20} /> : col.render ? col.render(row, index) : (value as React.ReactNode) || "—"}</td>;
									  })}

									  {actions && <td className="px-4 py-3 border-b border-gray-200 whitespace-nowrap">{actions(row)}</td>}
								  </tr>
							  ))
							  ) : (
							  <tr><td colSpan={visibleColumns.length + (actions ? 1 : 0)} className="text-center py-10 text-gray-500">{emptyMessage}</td></tr>
						  )}
					  </tbody>
				  </table>
			  </div>
		  </div>
    </div>
  );
}

/* ===================================================
   COLUMN WISE TABLE
=================================================== */

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
	showFieldSelector?: boolean;
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
	showFieldSelector = true,
}: ColumnWiseTableProps<T>) => {
	const [visibleKeys, setVisibleKeys] = useState<string[]>(
		fields.map((field: any) => String(field.key))
	);

	useEffect(() => {
		setVisibleKeys(fields.map((field: any) => String(field.key)));
	}, [fields]);

	const visibleFields = useMemo(() => {
		return fields.filter((field: any) =>
			visibleKeys.includes(String(field.key))
		);
	}, [fields, visibleKeys]);

	if (!data || data.length === 0) {
		return (
			<div className="rounded-md border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
				{emptyMessage}
			</div>
		);
	}

	return (
		<div className="w-full">
			{showFieldSelector && fields.length > 0 && <div className="mb-3 flex justify-end"><FieldSelector columns={fields} visibleKeys={visibleKeys} setVisibleKeys={setVisibleKeys} /></div>}

			<div className="w-full overflow-x-auto rounded-md border border-slate-200 bg-white">
				<table className="min-w-full border-separate border-spacing-0 text-sm">
					<tbody>
						{showRecordNumber && (
							<tr>
								<td className={leftHeaderClass}>No of Records</td>
								{data.map((_: T, index: number) => <td key={`record-${index}`} className={valueHeaderClass}>{index + 1}</td>)}
							</tr>
						)}

						{visibleFields.map((field) => (
							<tr key={String(field.key)}>
								<td className={leftBodyClass}>{field.title}</td>
								{data.map((item: T, index: number) => <td key={`${String(field.key)}-${index}`} className={valueBodyClass}>{field.render ? field.render(item, index) : item?.[field.key as keyof T] || "-"}</td>)}
							</tr>
						))}

						{(onEdit || onDelete) && (
							<tr>
								<td className={leftHeaderClass}>Actions</td>
								{data.map((item: T, index: number) => (
									<td key={`actions-${index}`} className={valueBodyClass}>
										{onEdit && <button type="button" onClick={() => onEdit(item, index)} className="font-semibold text-indigo-700 hover:text-indigo-900">Edit</button>}
										{onEdit && onDelete && <span className="mx-2 text-slate-300">|</span>}
										{onDelete && <button type="button" onClick={() => onDelete(item, index)} className="font-semibold text-red-600 hover:text-red-800">Delete</button>}
									</td>
								))}
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export { ColumnWiseTable };