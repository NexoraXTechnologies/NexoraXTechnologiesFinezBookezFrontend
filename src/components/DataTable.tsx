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
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className={`cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all duration-200 ${open
						? "rotate-45 border-primary bg-primary text-primary-foreground shadow-app"
						: "border-border bg-card text-muted-foreground hover:bg-muted hover:text-primary"
					}`}
				title="Select Fields"
			>
				<Settings size={18} />
			</button>

			{open && (
				<div
					className="
						absolute right-0 top-11 z-50 w-72 rounded-xl border border-border
						bg-card text-card-foreground shadow-xl
					"
				>
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<h3 className="text-sm font-bold text-card-foreground">
							Select Fields
						</h3>

						<button
							type="button"
							onClick={handleReset}
							className="text-xs font-semibold text-primary hover:opacity-80"
						>
							Reset
						</button>
					</div>

					<div className="border-b border-border px-4 py-3">
						<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-muted-foreground">
							<input
								type="checkbox"
								checked={isAllSelected}
								onChange={handleSelectAll}
								className="h-4 w-4 cursor-pointer accent-primary"
							/>
							Select All
						</label>
					</div>

					<div className="max-h-72 overflow-y-auto p-2 custom-scroll">
						{columns.map((col: any) => {
							const key = String(col.key);
							const checked = visibleKeys.includes(key);

							return (
								<label
									key={key}
									className="
										flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2
										text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary
										transition-all duration-200
									"
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={() => handleToggleColumn(key)}
										className="h-4 w-4 cursor-pointer accent-primary"
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
		<div className="flex h-full min-h-0 w-full flex-col">
			{showFieldSelector && columns.length > 0 && (
				<div className="mb-3 flex shrink-0 justify-end">
					<FieldSelector
						columns={columns}
						visibleKeys={visibleKeys}
						setVisibleKeys={setVisibleKeys}
					/>
				</div>
			)}

			<div
				id="account-table-container"
				className="min-h-0 flex-1 overflow-auto rounded-md border border-border bg-card shadow-sm pb-3 custom-scroll"
			>
				<table className="min-w-[900px] w-full border-separate border-spacing-0 text-sm text-card-foreground">
					<thead className="sticky top-0 z-20 bg-muted">
						<tr>
							{visibleColumns?.map((col: any) => (
								<th
									key={String(col.key)}
									className={`px-4 py-4 border-b border-border bg-muted text-left font-semibold text-muted-foreground whitespace-nowrap ${col.className || ""} ${col?.type == "amount" && "text-right"}`}
								>
									{col.title}
								</th>
							))}

							{actions && (
								<th className="w-[120px] px-4 py-4 border-b border-border bg-muted text-left font-semibold text-muted-foreground whitespace-nowrap">
									Actions
								</th>
							)}
						</tr>
					</thead>

					<tbody>
						{loading ? (
							<tr>
								<td
									colSpan={visibleColumns?.length + (actions ? 1 : 0)}
									className="py-10 text-center text-muted-foreground"
								>
									<div className="flex flex-col items-center gap-2">
										<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
										<span>Loading...</span>
									</div>
								</td>
							</tr>
						) : data?.length ? (
							data.map((row, index) => (
								<tr
									key={index}
									className="transition-all duration-200 hover:bg-muted"
								>
									{visibleColumns?.map((col: any) => {
										const value = row?.[col?.key as keyof T];

										return (
											<td
												key={String(col.key)}
												className={`px-4 py-3 border-b border-border font-medium text-card-foreground whitespace-nowrap ${(col?.type == "amount") && "text-end"}`}
											>
												{col.type === "date"
													? value
														? new Date(value as any).toLocaleString()
														: "—"
													: col.type === "readMoreText"
														? (
															<ReadMoreText
																text={(value as string) || "—"}
																charLimit={20}
															/>
														)
														: col.render
															? col.render(row, index)
															: (value as React.ReactNode) || "—"}
											</td>
										);
									})}

									{actions && (
										<td className="px-4 py-3 border-b border-border whitespace-nowrap">
											{actions(row)}
										</td>
									)}
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={visibleColumns.length + (actions ? 1 : 0)}
									className="py-10 text-center text-muted-foreground"
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
	showFieldSelector?: boolean;
};

const leftHeaderClass = "sticky left-0 z-20 min-w-[180px] border-r border-b border-border bg-muted px-4 py-3 text-center font-bold text-foreground shadow-[1px_0_0_0_var(--border)]";
const leftBodyClass = "sticky left-0 z-20 min-w-[180px] border-r border-b border-border bg-card px-4 py-3 text-center font-semibold text-card-foreground shadow-[1px_0_0_0_var(--border)]";
const valueHeaderClass = "min-w-[220px] border-r border-b border-border bg-muted px-4 py-3 text-center font-bold text-foreground";
const valueBodyClass = "min-w-[220px] border-r border-b border-border bg-card px-4 py-3 text-center text-card-foreground";

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
			<div className="rounded-md border border-border bg-muted p-6 text-center text-muted-foreground">
				{emptyMessage}
			</div>
		);
	}

	return (
		<div className="w-full">
			{showFieldSelector && fields.length > 0 && (
				<div className="mb-3 flex justify-end">
					<FieldSelector
						columns={fields}
						visibleKeys={visibleKeys}
						setVisibleKeys={setVisibleKeys}
					/>
				</div>
			)}

			<div className="w-full overflow-x-auto rounded-md border border-border bg-card custom-scroll">
				<table className="min-w-full border-separate border-spacing-0 text-sm">
					<tbody>
						{showRecordNumber && (
							<tr>
								<td className={leftHeaderClass}>No of Records</td>
								{data.map((_: T, index: number) => (
									<td key={`record-${index}`} className={valueHeaderClass}>
										{index + 1}
									</td>
								))}
							</tr>
						)}

						{visibleFields.map((field) => (
							<tr key={String(field.key)}>
								<td className={leftBodyClass}>{field.title}</td>
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
								<td className={leftHeaderClass}>Actions</td>
								{data.map((item: T, index: number) => (
									<td key={`actions-${index}`} className={valueBodyClass}>
										{onEdit && (
											<button
												type="button"
												onClick={() => onEdit(item, index)}
												className="font-semibold text-primary hover:opacity-80"
											>
												Edit
											</button>
										)}
										{onEdit && onDelete && (
											<span className="mx-2 text-muted-foreground">|</span>
										)}
										{onDelete && (
											<button
												type="button"
												onClick={() => onDelete(item, index)}
												className="font-semibold text-danger hover:opacity-80"
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
		</div>
	);
};

export { ColumnWiseTable };