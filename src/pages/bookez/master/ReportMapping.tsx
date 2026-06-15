import { useEffect, useState } from "react";
import { Trash2, Edit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import SearchInput from "../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../components/buttons";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import Badge from "../../../components/badge";
import { SelectInput, TextInput } from "../../../components/inputs";
import Modal from "../../../components/modal";
import { createReportMapping, deleteReportMapping, getAllReportMapping, updateReportMapping, getAllModules, getAllModulesWiseKey } from "../../../redux/slices/professionalSlice/reportMappingSlice";
import { getTemplateKeyLabel } from "../../../utils/templateKeyLabel";

const ReportMapping = () => {
	const dispatch = useDispatch();
	const { report, pagination, loading, modules, modulesLoading, moduleWiseKeys, moduleWiseKeysLoading, } = useSelector((s: any) => s.reportMapping);
	/* =====================================================
		LIST FILTER / PAGINATION STATES
	===================================================== */
	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [moduleType, setModuleType] = useState("");
	// const [refreshing, setRefreshing] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [showFieldModal, setShowFieldModal] = useState(false);
	const [editingReport, setEditingReport] = useState<any>(null);
	const [errors, setErrors] = useState<any>({});
	const [isEditingFields, setIsEditingFields] = useState(false);

	/* =====================================================
		MAIN REPORT FORM STATE
	===================================================== */
	const [reportForm, setReportForm] = useState<any>({
		templateName: "",
		moduleType: "",
		file: null,
		templateMappings: {},
		mappingFields: [],
	});



	/* =====================================================
		ADD FIELD MODAL FORM STATE
	===================================================== */
	const [fieldForm, setFieldForm] = useState<any>({
		tab: "Module",
		key: "",
		type: "dropdown",
		value: "",
		customValue: "",
	});

	/* =====================================================
		DELETE CONFIRM TOOLTIP STATE
	===================================================== */
	const [confirmTooltip, setConfirmTooltip] = useState({
		show: false,
		x: null,
		y: null,
		templateFileId: null,
	});

	/* =====================================================
		TABLE COLUMNS
	===================================================== */
	const columns = [
		{ key: "templateName", title: "Template Name" },
		{ key: "moduleType", title: "Module Type" },
		{ key: "createdOn", title: "Created On", type: "date" },
	];

	/* =====================================================
		MODULE OPTIONS
		Used in:
		1. List filter dropdown
		2. Report mapping form dropdown
	===================================================== */
	useEffect(() => {
		{/* @ts-ignore */ }
		dispatch(getAllModules() as any);
	}, [dispatch]);


	const moduleOptions =
		modules?.map((item: string) => ({
			label: item,
			value: item,
		})) || [];




	/* =====================================================
		DROPDOWN OPTIONS FOR KEY-VALUE FIELD MODAL

		You can replace these dummy fields with API data later.
	===================================================== */
	const makeOptionsFromKeys = (keys: any[] = []) => {
		if (!Array.isArray(keys)) return [];

		return keys.map((item: any) => {
			if (typeof item === "string") {
				return {
					label: getTemplateKeyLabel(item),
					value: item,
				};
			}

			const value = item?.value || item?.key || item?.name || item?.label || "";

			return {
				label: item?.label || getTemplateKeyLabel(value),
				value,
			};
		});
	};

	const moduleKeyOptions = makeOptionsFromKeys(
		moduleWiseKeys?.namespacedModuleKeys || []
	);

	const companyKeyOptions = makeOptionsFromKeys(
		moduleWiseKeys?.namespacedCompanyMaster || []
	);

	const accountKeyOptions = makeOptionsFromKeys(
		moduleWiseKeys?.namespacedAccountMaster || []
	);

	const selectedTabOptions =
		fieldForm.tab === "Module"
			? moduleKeyOptions
			: fieldForm.tab === "Company"
				? companyKeyOptions
				: fieldForm.tab === "Account"
					? accountKeyOptions
					: [];
	/* =====================================================
		GET ALL REPORT MAPPING LIST

		Called when:
		- page changes
		- limit changes
		- search changes
		- module filter changes
	===================================================== */
	const fetchReportMapping = () => {
		dispatch(
			getAllReportMapping({
				offset: localOffset,
				limit: localLimit,
				search: debouncedSearch,
				moduleType,
			}) as any
		);
	};

	useEffect(() => {
		fetchReportMapping();
	}, [localOffset, localLimit, debouncedSearch, moduleType]);

	/* =====================================================
		DEBOUNCE SEARCH
	===================================================== */
	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(search.trim());
			setLocalOffset(0);
		}, 400);

		return () => clearTimeout(t);
	}, [search]);

	/* =====================================================
		REFRESH LIST
	===================================================== */
	const handleRefresh = async () => {
		// setRefreshing(true);
		await fetchReportMapping();
		toast.success("Report mapping list refreshed");
		// setRefreshing(false);
	};

	/* =====================================================
		SYNC mappingFields ARRAY TO templateMappings OBJECT

		This is important because:
		- mappingFields is used for UI edit/delete
		- templateMappings is used for API payload
	===================================================== */
	const syncTemplateMappings = (fields: any[]) => {
		const mappings = fields.reduce((acc: any, item: any) => {
			const finalValue =
				item.type === "custom" ? item.customValue : item.value;

			if (item.key && finalValue) {
				acc[item.key] = finalValue;
			}

			return acc;
		}, {});

		setReportForm((prev: any) => ({
			...prev,
			mappingFields: fields,
			templateMappings: mappings,
		}));
	};

	/* =====================================================
		OPEN ADD REPORT MODAL

		Reset all form data
	===================================================== */
	const openAddModal = () => {
		setEditingReport(null);
		setErrors({});
		setIsEditingFields(false);

		setReportForm({
			templateName: "",
			moduleType: "",
			file: null,
			templateMappings: {},
			mappingFields: [],
		});

		setShowModal(true);
	};

	/* =====================================================
		OPEN EDIT REPORT MODAL

		Converts templateMappings object to mappingFields array
		so that user can edit/delete fields in UI.
	===================================================== */

	const openEditModal = (p: any) => {
		setEditingReport(p);
		setErrors({});
		setIsEditingFields(false);

		const selectedModuleType = p?.moduleType || "";

		if (selectedModuleType) {
			dispatch(
				getAllModulesWiseKey({
					moduleType: selectedModuleType,
					offset: 0,
					limit: 100,
				}) as any
			);
		}

		const mappingFields = Object.entries(p?.templateMappings || {}).map(
			([key, value]: any) => ({
				key,
				type: "dropdown",
				value,
				customValue: "",
			})
		);

		setReportForm({
			templateName: p?.templateName || "",
			moduleType: selectedModuleType,
			file: null,
			templateMappings: p?.templateMappings || {},
			mappingFields,
		});

		setShowModal(true);
	};


	const getOptionsByValue = (value: string) => {
		if (!value) return selectedTabOptions;

		if (value.startsWith("companyMaster.")) {
			return companyKeyOptions;
		}

		if (value.startsWith("accountMaster.")) {
			return accountKeyOptions;
		}

		if (value.startsWith("module.")) {
			return moduleKeyOptions;
		}

		return selectedTabOptions;
	};

	/* =====================================================
		VALIDATE AND SAVE REPORT MAPPING

		Add create/update API call here.
	===================================================== */
	/* =====================================================
	VALIDATE AND SAVE REPORT MAPPING

	Create mode:
	- Calls createReportMapping API

	Edit mode:
	- Calls updateReportMapping API using templateFileId

	Because file upload is included, we send FormData.
===================================================== */
	const handleSaveReportMapping = async () => {
		const e: any = {};

		if (!reportForm.templateName?.trim()) {
			e.templateName = "Report title is required";
		}

		if (!reportForm.moduleType) {
			e.moduleType = "Module type is required";
		}

		if (!reportForm.file && !editingReport) {
			e.file = "Document is required";
		}

		if (Object.keys(reportForm.templateMappings || {}).length === 0) {
			e.templateMappings = "Please add at least one field mapping";
			toast.error("Please add at least one field mapping");
		}

		setErrors(e);

		if (Object.keys(e).length > 0) return;

		try {
			const formData = new FormData();

			formData.append("templateName", reportForm.templateName.trim());
			formData.append("moduleType", reportForm.moduleType);

			formData.append(
				"mappings",
				JSON.stringify(reportForm.templateMappings)
			);


			if (reportForm.file instanceof File) {
				formData.append("file", reportForm.file, reportForm.file.name);
			}


			// for (const pair of formData.entries()) {
			// 	console.log(pair[0], pair[1]);
			// }

			if (editingReport) {
				await dispatch(
					updateReportMapping({
						templateFileId: editingReport.templateFileId,
						data: formData,
					}) as any
				).unwrap();

				toast.success("Report mapping updated successfully");
			} else {
				await dispatch(createReportMapping(formData) as any).unwrap();

				toast.success("Report mapping created successfully");
			}

			setShowModal(false);
			setEditingReport(null);
			setIsEditingFields(false);

			setReportForm({
				templateName: "",
				moduleType: "",
				file: null,
				templateMappings: {},
				mappingFields: [],
			});

			fetchReportMapping();
		} catch (err: any) {
			toast.error(err?.message || "Operation failed");
		}
	};
	/* =====================================================
		SAVE FIELD FROM ADD KEY-VALUE MODAL

		Adds new field into mappingFields array,
		then syncs templateMappings automatically.
	===================================================== */
	const handleSubmit = () => {
		const finalValue =
			fieldForm.type === "custom" ? fieldForm.customValue : fieldForm.value;

		if (!fieldForm.key?.trim() || !finalValue?.trim()) {
			toast.error("Please enter key and value");
			return;
		}

		const newField = {
			key: fieldForm.key.trim(),
			type: fieldForm.type,
			value: fieldForm.type === "dropdown" ? fieldForm.value.trim() : "",
			customValue:
				fieldForm.type === "custom" ? fieldForm.customValue.trim() : "",
		};

		const updatedFields = [...reportForm.mappingFields, newField];

		syncTemplateMappings(updatedFields);
		setFieldForm({
			tab: "Module", // first tab selected
			key: "",
			type: "dropdown",
			value: "",
			customValue: "",
		});

		setShowFieldModal(false);
	};

	/* =====================================================
		UPDATE ADDED FIELD WHILE EDITING

		Used when user clicks "Edit Added Fields"
		and modifies key/type/value.
	===================================================== */
	const updateMappingField = (index: number, fieldKey: string, value: any) => {
		const updatedFields = [...reportForm.mappingFields];

		updatedFields[index] = {
			...updatedFields[index],
			[fieldKey]: value,
		};

		// If type changes, clear both dropdown/custom values
		if (fieldKey === "type") {
			updatedFields[index].value = "";
			updatedFields[index].customValue = "";
		}

		syncTemplateMappings(updatedFields);
	};

	/* =====================================================
		DELETE ADDED FIELD WHILE EDITING
	===================================================== */
	const deleteMappingField = (index: number) => {
		const updatedFields = reportForm.mappingFields.filter(
			(_: any, i: number) => i !== index
		);

		syncTemplateMappings(updatedFields);
	};


	/* =====================================================
	DELETE REPORT MAPPING

	Uses templateFileId from confirmTooltip.
===================================================== */
	const handleDeleteConfirm = async () => {
		try {
			// @ts-ignore
			await dispatch(deleteReportMapping(confirmTooltip.templateFileId) as any
			).unwrap();

			toast.success("Report deleted");
			fetchReportMapping();
		} catch (err: any) {
			toast.error(err?.message || "Failed to delete report");
		} finally {
			setConfirmTooltip({
				show: false,
				x: null,
				y: null,
				templateFileId: null,
			});
		}
	};
	/* =====================================================
		GET SHORT MODULE LABEL FOR FIRST TAB
	
		salesOrder      -> SO
		purchaseInvoice -> PI
		grn             -> GRN
	===================================================== */
	const getModuleShortLabel = (moduleTypeValue: string) => {
		if (!moduleTypeValue) return "Module";

		const words = String(moduleTypeValue)
			.replace(/([A-Z])/g, " $1")
			.trim()
			.split(/\s+/);

		if (words.length === 1) {
			return words[0].toUpperCase();
		}

		return words
			.map((word) => word.charAt(0).toUpperCase())
			.join("");
	};

	const dynamicModuleTabLabel = getModuleShortLabel(reportForm.moduleType);

	/*
		label = what user sees
		value = what we store in fieldForm.tab
	*/
	const fieldTabs = [
		{ label: dynamicModuleTabLabel, value: "Module" },
		{ label: "Company", value: "Company" },
		{ label: "Account", value: "Account" },
	];


	const activeFieldTab = fieldForm.tab || "Module";

	useEffect(() => {
		if (showFieldModal) {
			setFieldForm((prev: any) => ({
				...prev,
				tab: "Module",
				value: "",
			}));
		}
	}, [showFieldModal]);
	return (
		<div className="w-full bg-white border border-gray-200 rounded-md shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}
			<div id="unit-header" className="flex items-center mb-3">
				<div id="unit-summary" className="flex items-start gap-3">
					<Badge
						{...{
							count: pagination.totalDocs ?? 0,
							text: "Total Reports:",
							varient: "primary",
						}}
					/>
				</div>

				<div className="ml-auto flex items-center gap-2">
					{/* Module Type Filter */}
					<div className="flex-1 min-w-[220px] h-9 rounded-md">

						<SelectInput
							label=""
							value={moduleType}
							onChange={(e: any) => {
								setModuleType(e.target.value);
								setLocalOffset(0);
							}}
							className="cursor-pointer px-5 flex items-center justify-center gap-2 rounded-md"
							options={[
								{
									label: modulesLoading ? "Loading Modules..." : "All Modules",
									value: "",
								},
								...moduleOptions,
							]}
						/>


					</div>

					{/* Search */}
					<SearchInput {...{ search, setSearch }} />

					{/* Refresh */}
					<DataREfreshButton {...{ callBackFn: handleRefresh }} />

					{/* Add Report */}
					{/* @ts-ignore */}
					<DataCreateButton
						{...{
							callBackFn: openAddModal,
							text: "Add Report",
						}}
					/>
				</div>
			</div>

			{/* ================= TABLE ================= */}
			<DataTable
				columns={columns}
				data={report}
				loading={loading}
				emptyMessage="No reports found"
				actions={(report: any) => (
					<div className="flex items-center gap-2">
						{/* Edit Report */}
						<button
							id="unit-edit-button"
							onClick={() => openEditModal(report)}
							className="p-2 rounded-md text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer"
						>
							<Edit size={16} />
						</button>

						{/* Delete Report */}
						<button
							id="unit-delete-button"
							onClick={(e: any) => {
								const rect: any = e.currentTarget.getBoundingClientRect();

								let x: any = rect.left - 150;
								if (x < 10) x = 10;

								const y: any = rect.top + window.scrollY - 5;

								setConfirmTooltip({
									show: true,
									x,
									y,
									templateFileId: report.templateFileId,
								});
							}}
							className="p-2 rounded-md text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			{/* ================= PAGINATION ================= */}
			{pagination.totalDocs > 0 && (
				<Pagination
					{...{
						localLimit,
						selectCb: (e: any) => {
							setLocalLimit(Number(e.target.value));
							setLocalOffset(0);
						},
						preDisabled: !pagination.hasPrevPage,
						nextDisabled: !pagination.hasNextPage,
						setLocalOffset,
						pagination,
					}}
				/>
			)}

			{/* ================= DELETE TOOLTIP ================= */}
			{confirmTooltip.show && (
				<ConfirmTooltip
					x={confirmTooltip.x}
					y={confirmTooltip.y}
					message="Are you sure you want to delete this report?"
					confirmText="Delete"
					cancelText="Cancel"
					onConfirm={handleDeleteConfirm}
					onCancel={() =>
						setConfirmTooltip({
							show: false,
							x: null,
							y: null,
							templateFileId: null,
						})
					}
				/>
			)}

			{/* ================= REPORT MAPPING MODAL ================= */}
			{/* @ts-ignore */}
			<Modal
				{...{
					show: showModal,
					setShow: setShowModal,
					handleSubmit: handleSaveReportMapping,
					state: editingReport,
					title: "Add New Report Mapping",
					body: (
						<>
							{/* Report Title */}
							<TextInput
								label="Report Title"
								mandatory={true}
								value={reportForm.templateName}
								onChange={(e: any) =>
									setReportForm({
										...reportForm,
										templateName: e.target.value,
									})
								}
								placeholder="Enter report title"
								error={errors.templateName}
							/>
							{/* Module Type */}
							<SelectInput
								label="Select Dropdown"
								mandatory={true}
								value={reportForm.moduleType}
								onChange={(e: any) => {
									const selectedModuleType = e.target.value;

									setReportForm((prev: any) => ({
										...prev,
										moduleType: selectedModuleType,
										templateMappings: {},
										mappingFields: [],
									}));

									setFieldForm((prev: any) => ({
										...prev,
										tab: "Module",
										value: "",
									}));

									if (selectedModuleType) {
										dispatch(
											getAllModulesWiseKey({
												moduleType: selectedModuleType,
												offset: 0,
												limit: 100,
											}) as any
										);
									}
								}}
								options={[
									{ label: "Select Dropdown", value: "" },
									...moduleOptions,
								]}
								error={errors.moduleType}
							/>

							{/* Attach Document */}
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700">
									Attach Document<span className="text-red-500">*</span>
								</label>

								<label className="flex h-9 w-full cursor-pointer items-center rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm transition-all hover:border-indigo-400">
									<input
										type="file"
										accept=".doc,.docx"
										className="hidden"
										onChange={(e: any) => {
											const selectedFile = e.target.files?.[0];

											if (!selectedFile) return;

											setReportForm((prev: any) => ({
												...prev,
												file: selectedFile,
											}));

											setErrors((prev: any) => ({
												...prev,
												file: "",
											}));

											console.log("Selected file:", selectedFile);
										}}
									/>
									<span className="truncate">
										{reportForm.file?.name ||
											"Select Word File (.doc, .docx)"}
									</span>
								</label>
								{errors.file && (
									<p className="mt-1 text-xs text-red-500">
										{errors.file}
									</p>
								)}
							</div>

							{/* Add Key-Value Button */}
							<div className="flex items-end justify-end">
								<button
									type="button"
									onClick={() => {
										setFieldForm({
											tab: "Module", // first tab selected
											key: "",
											type: "dropdown",
											value: "",
											customValue: "",
										});

										setShowFieldModal(true);
									}}
									className="h-9 rounded-md bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
								>
									+ Add
								</button>
							</div>

							{/* Added Fields Section */}
							<div className="col-span-2 rounded-md border border-gray-200 bg-gray-50 p-4">
								<div className="mb-3 flex items-center justify-between gap-3">
									<h3 className="text-base font-semibold text-gray-900">
										Added Fields ({reportForm.mappingFields.length})
									</h3>

									{/* Toggle edit mode only when fields exist */}
									{reportForm.mappingFields.length > 0 && (
										<button
											type="button"
											onClick={() =>
												setIsEditingFields((prev) => !prev)
											}
											className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
										>
											{isEditingFields
												? "Cancel Edit"
												: "Edit Added Fields"}
										</button>
									)}
								</div>

								{/* Empty State */}
								{reportForm.mappingFields.length === 0 ? (
									<p className="text-sm text-gray-500">
										No fields added yet.
									</p>
								) : isEditingFields ? (
									/* =====================================================
										EDIT MODE
										User can:
										- edit key
										- change type dropdown/custom
										- edit value
									===================================================== */
									<div className="space-y-4">
										{reportForm.mappingFields.map(
											(item: any, index: number) => (
												<div
													key={index}
													className="rounded-md border border-gray-200 bg-white p-4"
												>
													<p className="mb-3 text-sm font-bold text-gray-900">
														#{index + 1}
													</p>

													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
														{/* Key Edit */}
														<TextInput
															label="Key"
															value={item.key}
															onChange={(e: any) =>
																updateMappingField(
																	index,
																	"key",
																	e.target.value
																)
															}
															placeholder="Enter key"
														/>

														{/* Type Edit */}
														<div>
															<label className="mb-1 block text-sm font-medium text-gray-700">
																Type
															</label>

															<div className="flex h-9 items-center gap-8 rounded-md border border-gray-300 bg-white px-3">
																<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
																	<input
																		type="radio"
																		checked={
																			item.type === "dropdown"
																		}
																		onChange={() =>
																			updateMappingField(
																				index,
																				"type",
																				"dropdown"
																			)
																		}
																	/>
																	Dropdown
																</label>

																<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
																	<input
																		type="radio"
																		checked={
																			item.type === "custom"
																		}
																		onChange={() =>
																			updateMappingField(
																				index,
																				"type",
																				"custom"
																			)
																		}
																	/>
																	Custom
																</label>
															</div>
														</div>

														{/* Value Edit */}
														<div className="md:col-span-2">
															{item.type === "dropdown" ? (

																<SelectInput
																	label="Value"
																	value={item.value}
																	onChange={(e: any) =>
																		updateMappingField(index, "value", e.target.value)
																	}
																	options={[
																		{
																			label: moduleWiseKeysLoading ? "Loading Keys..." : "Select Dropdown",
																			value: "",
																		},
																		...getOptionsByValue(item.value),
																	]}
																/>
															) : (
																<TextInput
																	label="Value"
																	value={item.customValue}
																	onChange={(e: any) =>
																		updateMappingField(
																			index,
																			"customValue",
																			e.target.value
																		)
																	}
																	placeholder="Enter custom value"
																/>
															)}
														</div>
													</div>

													{/* Delete Added Field */}
													<div className="mt-4 flex justify-end">
														<button
															type="button"
															onClick={() =>
																deleteMappingField(index)
															}
															className="rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
														>
															Delete
														</button>
													</div>
												</div>
											)
										)}
									</div>
								) : (
									/* =====================================================
										VIEW MODE
										User can only preview added fields.
									===================================================== */
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{reportForm.mappingFields.map(
											(item: any, index: number) => {
												const finalValue =
													item.type === "custom"
														? item.customValue
														: item.value;

												return (
													<div
														key={index}
														className="rounded-md border border-gray-200 bg-white px-4 py-3"
													>
														<p className="mb-3 text-sm font-bold text-gray-900">
															#{index + 1}
														</p>

														<div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
															<span className="font-semibold text-gray-500">
																Key
															</span>
															<span className="truncate font-semibold text-gray-900">
																{item.key}
															</span>

															<span className="font-semibold text-gray-500">
																Type
															</span>
															<span className="font-semibold text-gray-900">
																{item.type}
															</span>

															<span className="font-semibold text-gray-500">
																Value
															</span>
															{/* <span className="truncate font-semibold text-gray-900">
																{finalValue}
															</span> */}

															<span className="truncate font-semibold text-gray-900">
																{item.type === "custom" ? finalValue : getTemplateKeyLabel(finalValue)}
															</span>
														</div>
													</div>
												);
											}
										)}
									</div>
								)}
							</div>
						</>
					),
				}}
			/>

			{/* ================= ADD KEY VALUE MODAL ================= */}
			{/* @ts-ignore */}
			<Modal
				{...{
					show: showFieldModal,
					setShow: setShowFieldModal,
					handleSubmit,
					state: null,
					title: "Add New Key-Value Fields",
					body: (
						<>
							{/* Tabs */}
							<div className="col-span-2 grid grid-cols-3 rounded-md bg-gray-100 p-1">
								{fieldTabs.map((tab) => {
									const isSelected = activeFieldTab === tab.value;

									return (
										<button
											key={tab.value}
											type="button"
											onClick={() =>
												setFieldForm((prev: any) => ({
													...prev,
													tab: tab.value,
													value: "",
												}))
											}
											className={`rounded-md py-2 text-sm font-semibold transition-all ${isSelected
												? "bg-indigo-600 text-white shadow-sm"
												: "text-gray-600 hover:bg-white"
												}`}
										>
											{tab.label}
										</button>
									);
								})}
							</div>

							{/* Key Input */}
							<TextInput
								label="Key"
								value={fieldForm.key}
								onChange={(e: any) =>
									setFieldForm({
										...fieldForm,
										key: e.target.value,
									})
								}
								placeholder="Key (e.g. customerName)"
							/>

							{/* Type Radio */}
							<div>
								<label className="mb-1 block text-sm font-medium text-gray-700">
									Type
								</label>

								<div className="flex h-9 items-center gap-8 rounded-md border border-gray-300 bg-white px-3">
									<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
										<input
											type="radio"
											checked={fieldForm.type === "dropdown"}
											onChange={() =>
												setFieldForm({
													...fieldForm,
													type: "dropdown",
													customValue: "",
												})
											}
										/>
										Dropdown
									</label>

									<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
										<input
											type="radio"
											checked={fieldForm.type === "custom"}
											onChange={() =>
												setFieldForm({
													...fieldForm,
													type: "custom",
													value: "",
												})
											}
										/>
										Custom
									</label>
								</div>
							</div>

							{/* Value Input / Dropdown */}
							<div className="col-span-2">
								{fieldForm.type === "dropdown" ? (
									<SelectInput
										label="Select Dropdown"
										value={fieldForm.value}
										onChange={(e: any) =>
											setFieldForm({
												...fieldForm,
												value: e.target.value,
											})
										}
										options={[
											{
												label: moduleWiseKeysLoading ? "Loading Keys..." : "Select Dropdown",
												value: "",
											},
											...selectedTabOptions,
										]}
									/>
								) : (
									<TextInput
										label="Custom"
										value={fieldForm.customValue}
										onChange={(e: any) =>
											setFieldForm({
												...fieldForm,
												customValue: e.target.value,
											})
										}
										placeholder="Enter custom value"
									/>
								)}
							</div>
						</>
					),
				}}
			/>
		</div>
	);
};

export default ReportMapping;