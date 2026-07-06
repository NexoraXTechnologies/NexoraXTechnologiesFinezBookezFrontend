import React, { useEffect, useMemo, useRef, useState } from "react";
import { Filter, Settings } from "lucide-react";
import ReadMoreText from "./common/ReadMoreText";

/* ===================================================
   COMMON TYPES
=================================================== */

type FilterOption = {
	label: string;
	value: string;
};

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

	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const GEAR_SIZE = 40;
	const DROPDOWN_WIDTH = 288;
	const GAP = 12;

	const [position, setPosition] = useState({
		x: 12,
		y: 12,
	});

	const [parentSize, setParentSize] = useState({
		width: 0,
		height: 0,
	});

	const [dragging, setDragging] = useState(false);
	const [wasDragged, setWasDragged] = useState(false);

	const dragStartRef = useRef({
		mouseX: 0,
		mouseY: 0,
		startX: 0,
		startY: 0,
	});

	const allKeys = useMemo(
		() => columns.map((col: any) => String(col.key)),
		[columns]
	);

	const isAllSelected = visibleKeys.length === allKeys.length;

	useEffect(() => {
		const parent = wrapperRef.current?.parentElement;

		if (!parent) return;

		const updateDefaultPosition = () => {
			const rect = parent.getBoundingClientRect();

			setParentSize({
				width: rect.width,
				height: rect.height,
			});

			setPosition((prev) => {
				const isInitialPosition = prev.x === 12 && prev.y === 12;

				if (!isInitialPosition) return prev;

				return {
					x: Math.max(GAP, rect.width - GEAR_SIZE - GAP),
					y: Math.max(GAP, rect.height - GEAR_SIZE - GAP),
				};
			});
		};

		updateDefaultPosition();

		window.addEventListener("resize", updateDefaultPosition);

		return () => {
			window.removeEventListener("resize", updateDefaultPosition);
		};
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			if (!dragging) return;

			const parent = wrapperRef.current?.parentElement;
			const parentRect = parent?.getBoundingClientRect();

			if (!parentRect) return;

			const dx = event.clientX - dragStartRef.current.mouseX;
			const dy = event.clientY - dragStartRef.current.mouseY;

			if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
				setWasDragged(true);
			}

			const nextX = dragStartRef.current.startX + dx;
			const nextY = dragStartRef.current.startY + dy;

			setParentSize({
				width: parentRect.width,
				height: parentRect.height,
			});

			setPosition({
				x: Math.min(
					Math.max(0, nextX),
					Math.max(0, parentRect.width - GEAR_SIZE)
				),
				y: Math.min(
					Math.max(0, nextY),
					Math.max(0, parentRect.height - GEAR_SIZE)
				),
			});
		};

		const handleMouseUp = () => {
			setDragging(false);
		};

		if (dragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragging]);

	const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		setWasDragged(false);

		dragStartRef.current = {
			mouseX: event.clientX,
			mouseY: event.clientY,
			startX: position.x,
			startY: position.y,
		};

		setDragging(true);
	};

	const handleGearClick = () => {
		if (wasDragged) return;

		setOpen((prev) => !prev);
	};

	const handleToggleColumn = (key: string) => {
		setVisibleKeys((prev) => {
			const alreadySelected = prev.includes(key);

			if (alreadySelected) {
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

	const isRightSide = position.x > parentSize.width / 2;
	const isBottomSide = position.y > parentSize.height / 2;

	return (
		<div
			ref={wrapperRef}
			className="absolute z-[999]"
			style={{
				left: position.x,
				top: position.y,
			}}
		>
			<button
				type="button"
				onMouseDown={handleMouseDown}
				onClick={handleGearClick}
				className={`
					group relative inline-flex h-10 w-10 cursor-grab items-center justify-center rounded-full border-2
					transition-all duration-300 active:cursor-grabbing hover:scale-110
					${open
						? "border-primary bg-primary text-primary-foreground"
						: "border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground"
					}
				`}
				style={{
					boxShadow: open
						? "0 0 0 1px rgba(59,130,246,0.30), 0 0 35px rgba(59,130,246,0.95)"
						: "0 0 0 1px rgba(59,130,246,0.24), 0 0 30px rgba(59,130,246,0.85)",
				}}
				title="Drag or click to select fields"
			>
				<Settings
					size={19}
					className="animate-spin [animation-duration:2s]"
				/>
			</button>

			{open && (
				<div
					className={`
						absolute z-[999] rounded border border-border
						bg-card text-card-foreground shadow-xl transition-all duration-200
						${isRightSide ? "right-0" : "left-0"}
						${isBottomSide ? "bottom-12" : "top-12"}
					`}
					style={{
						width: DROPDOWN_WIDTH,
					}}
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
										text-sm font-medium text-muted-foreground transition-all duration-200
										hover:bg-muted hover:text-primary
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
   FLOATING FILTER
=================================================== */

type FloatingFilterProps = {
	activeFilter?: string;
	onFilterChange?: (value: string) => void;
	options?: FilterOption[];
};

const FloatingFilter = ({
	activeFilter = "all",
	onFilterChange,
	options = [
		{ label: "All", value: "all" },
		{ label: "Cash", value: "cash" },
		{ label: "Bank", value: "bank" },
		{ label: "Sale", value: "sale" },
		{ label: "Purchase", value: "purchase" },
		{ label: "Customer", value: "customer" },
		{ label: "Vendor", value: "vendor" },
	],
}: FloatingFilterProps) => {
	const [open, setOpen] = useState(false);

	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const FILTER_SIZE = 40;
	const DROPDOWN_WIDTH = 224;
	const GAP = 12;

	const [position, setPosition] = useState({
		x: 12,
		y: 12,
	});

	const [parentSize, setParentSize] = useState({
		width: 0,
		height: 0,
	});

	const [dragging, setDragging] = useState(false);
	const [wasDragged, setWasDragged] = useState(false);

	const dragStartRef = useRef({
		mouseX: 0,
		mouseY: 0,
		startX: 0,
		startY: 0,
	});

	useEffect(() => {
		const parent = wrapperRef.current?.parentElement;

		if (!parent) return;

		const updateDefaultPosition = () => {
			const rect = parent.getBoundingClientRect();

			setParentSize({
				width: rect.width,
				height: rect.height,
			});

			setPosition((prev) => {
				const isInitialPosition = prev.x === 12 && prev.y === 12;

				if (!isInitialPosition) return prev;

				return {
					x: Math.max(GAP, rect.width - FILTER_SIZE - GAP),
					y: Math.max(GAP, rect.height - FILTER_SIZE - 70),
				};
			});
		};

		updateDefaultPosition();

		window.addEventListener("resize", updateDefaultPosition);

		return () => {
			window.removeEventListener("resize", updateDefaultPosition);
		};
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const handleMouseMove = (event: MouseEvent) => {
			if (!dragging) return;

			const parent = wrapperRef.current?.parentElement;
			const parentRect = parent?.getBoundingClientRect();

			if (!parentRect) return;

			const dx = event.clientX - dragStartRef.current.mouseX;
			const dy = event.clientY - dragStartRef.current.mouseY;

			if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
				setWasDragged(true);
			}

			const nextX = dragStartRef.current.startX + dx;
			const nextY = dragStartRef.current.startY + dy;

			setParentSize({
				width: parentRect.width,
				height: parentRect.height,
			});

			setPosition({
				x: Math.min(
					Math.max(0, nextX),
					Math.max(0, parentRect.width - FILTER_SIZE)
				),
				y: Math.min(
					Math.max(0, nextY),
					Math.max(0, parentRect.height - FILTER_SIZE)
				),
			});
		};

		const handleMouseUp = () => {
			setDragging(false);
		};

		if (dragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragging]);

	const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();

		setWasDragged(false);

		dragStartRef.current = {
			mouseX: event.clientX,
			mouseY: event.clientY,
			startX: position.x,
			startY: position.y,
		};

		setDragging(true);
	};

	const handleFilterClick = () => {
		if (wasDragged) return;

		setOpen((prev) => !prev);
	};

	const isRightSide = position.x > parentSize.width / 2;
	const isBottomSide = position.y > parentSize.height / 2;

	return (
		<div
			ref={wrapperRef}
			className="absolute z-[999]"
			style={{
				left: position.x,
				top: position.y,
			}}
		>
			<button
				type="button"
				onMouseDown={handleMouseDown}
				onClick={handleFilterClick}
				className={`
					group relative inline-flex h-10 w-10 cursor-grab items-center justify-center rounded-full border-2
					transition-all duration-300 active:cursor-grabbing hover:scale-110
					${open || activeFilter !== "all"
						? "border-primary bg-primary text-primary-foreground"
						: "border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground"
					}
				`}
				style={{
					boxShadow:
						open || activeFilter !== "all"
							? "0 0 0 1px rgba(59,130,246,0.30), 0 0 20px rgba(59,130,246,0.95)"
							: "0 0 0 1px rgba(59,130,246,0.20), 0 0 28px rgba(59,130,246,0.75)",
				}}
				title="Drag or click to filter"
			>
				<Filter
					size={19}
					className={`
						transition-transform duration-300
						${open ? "rotate-180" : "group-hover:rotate-12"}
					`}
				/>
			</button>

			{open && (
				<div
					className={`
						absolute z-[999] overflow-hidden rounded border border-border
						bg-card text-card-foreground shadow-xl transition-all duration-200
						${isRightSide ? "right-0" : "left-0"}
						${isBottomSide ? "bottom-12" : "top-12"}
					`}
					style={{
						width: DROPDOWN_WIDTH,
					}}
				>
					<div className="border-b border-border px-4 py-3">
						<h3 className="text-sm font-bold text-card-foreground">
							Filter By
						</h3>
					</div>

					<div className="p-2">
						{options.map((item) => {
							const selected = activeFilter === item.value;

							return (
								<button
									key={item.value}
									type="button"
									onClick={() => {
										onFilterChange?.(item.value);
										setOpen(false);
									}}
									className={`
										flex w-full items-center justify-between rounded-lg px-3 py-2
										text-left text-sm font-semibold transition-all duration-200
										${selected
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-primary"
										}
									`}
								>
									<span>{item.label}</span>

									{selected && (
										<span className="text-xs font-bold">
											✓
										</span>
									)}
								</button>
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

	showFloatingFilter?: boolean;
	activeFilter?: string;
	onFilterChange?: (value: string) => void;
	filterOptions?: FilterOption[];
	filterKeys?: string[];
};

export default function DataTable<T>({
	columns = [],
	data,
	loading,
	emptyMessage = "No data found",
	actions,
	showFieldSelector = true,
	showFloatingFilter = false,
	activeFilter,
	onFilterChange,
	filterOptions = [
		{ label: "All", value: "all" },
		{ label: "Cash", value: "cash" },
		{ label: "Bank", value: "bank" },
		{ label: "Sale", value: "sale" },
		{ label: "Purchase", value: "purchase" },
		{ label: "Customer", value: "customer" },
		{ label: "Vendor", value: "vendor" },
	],
	filterKeys = ["accountType", "type", "module", "category", "groupName"],
}: DataTableProps<T>) {
	const [visibleKeys, setVisibleKeys] = useState<string[]>(
		columns.map((col: any) => String(col.key))
	);

	const [localFilter, setLocalFilter] = useState("all");

	const selectedFilter = activeFilter ?? localFilter;

	useEffect(() => {
		setVisibleKeys(columns.map((col: any) => String(col.key)));
	}, [columns]);

	const visibleColumns = useMemo(() => {
		return columns.filter((col: any) =>
			visibleKeys.includes(String(col.key))
		);
	}, [columns, visibleKeys]);

	const handleFilterChange = (value: string) => {
		setLocalFilter(value);
		onFilterChange?.(value);
	};

	const normalizeValue = (value: any) => {
		return String(value ?? "")
			.trim()
			.toLowerCase();
	};

	const getNestedValue = (obj: any, path: string) => {
		return path.split(".").reduce((acc, key) => acc?.[key], obj);
	};

	const filteredData = useMemo(() => {
		if (!showFloatingFilter) return data;

		if (!selectedFilter || selectedFilter === "all") return data;

		const selected = normalizeValue(selectedFilter);

		return data.filter((row: any) => {
			return filterKeys.some((key) => {
				const value = getNestedValue(row, key);

				if (value === undefined || value === null) return false;

				if (Array.isArray(value)) {
					return value.some((item) => normalizeValue(item) === selected);
				}

				return normalizeValue(value) === selected;
			});
		});
	}, [data, selectedFilter, showFloatingFilter, filterKeys]);

	return (
		<div className="flex h-full min-h-0 w-full flex-col">
			<div className="relative min-h-0 flex-1">
				{showFieldSelector && columns.length > 0 && (
					<FieldSelector
						columns={columns}
						visibleKeys={visibleKeys}
						setVisibleKeys={setVisibleKeys}
					/>
				)}

				{showFloatingFilter && (
					<FloatingFilter
						activeFilter={selectedFilter}
						onFilterChange={handleFilterChange}
						options={filterOptions}
					/>
				)}

				<div
					id="account-table-container"
					className="h-full min-h-0 flex-1 overflow-auto rounded-md border border-border bg-card pb-3 shadow-sm custom-scroll"
				>
					<table className="min-w-[900px] w-full border-separate border-spacing-0 text-sm text-card-foreground">
						<thead className="sticky top-0 z-20 bg-muted">
							<tr>
								{visibleColumns?.map((col: any) => (
									<th
										key={String(col.key)}
										className={`border-b border-border bg-muted px-4 py-4 text-left font-semibold text-muted-foreground whitespace-nowrap ${col.className || ""
											} ${col?.type === "amount" && "text-right"}`}
									>
										{col.title}
									</th>
								))}

								{actions && (
									<th className="w-[120px] border-b border-border bg-muted px-4 py-4 text-left font-semibold text-muted-foreground whitespace-nowrap">
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
							) : filteredData?.length ? (
								filteredData.map((row, index) => (
									<tr
										key={index}
										className="transition-all duration-200 hover:bg-muted"
									>
										{visibleColumns?.map((col: any) => {
											const value = row?.[col?.key as keyof T];

											return (
												<td
													key={String(col.key)}
													className={`border-b border-border px-4 py-3 font-medium text-card-foreground whitespace-nowrap ${col?.type === "amount" && "text-end"
														}`}
												>
													{col.type === "date" ? (
														value ? (
															new Date(value as any).toLocaleString()
														) : (
															"—"
														)
													) : col.type === "readMoreText" ? (
														<ReadMoreText
															text={(value as string) || "—"}
															charLimit={20}
														/>
													) : col.render ? (
														col.render(row, index)
													) : (
														(value as React.ReactNode) || "—"
													)}
												</td>
											);
										})}

										{actions && (
											<td className="border-b border-border px-4 py-3 whitespace-nowrap">
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
										No data found for{" "}
										<span className="font-semibold text-primary">
											{
												filterOptions.find(
													(item) => item.value === selectedFilter
												)?.label
											}
										</span>
									</td>
								</tr>
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
	"sticky left-0 z-20 min-w-[180px] border-r border-b border-border bg-muted px-4 py-3 text-center font-bold text-foreground shadow-[1px_0_0_0_var(--border)]";

const leftBodyClass =
	"sticky left-0 z-20 min-w-[180px] border-r border-b border-border bg-card px-4 py-3 text-center font-semibold text-card-foreground shadow-[1px_0_0_0_var(--border)]";

const valueHeaderClass =
	"min-w-[220px] border-r border-b border-border bg-muted px-4 py-3 text-center font-bold text-foreground";

const valueBodyClass =
	"min-w-[220px] border-r border-b border-border bg-card px-4 py-3 text-center text-card-foreground";

const ColumnWiseTable = <T extends Record<string, any>>({
	data = [],
	fields = [],
	showRecordNumber = true,
	emptyMessage = "No data",
	onEdit,
	onDelete,
	showFieldSelector = false,
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
			<div className="relative w-full">
				{showFieldSelector && fields.length > 0 && (
					<FieldSelector
						columns={fields}
						visibleKeys={visibleKeys}
						setVisibleKeys={setVisibleKeys}
					/>
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
		</div>
	);
};

export { ColumnWiseTable };