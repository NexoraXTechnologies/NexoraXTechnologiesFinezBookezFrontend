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
import {
	createReportMapping,
	deleteReportMapping,
	getAllReportMapping,
	updateReportMapping,
	getAllModules,
	getAllModulesWiseKey,
} from "../../../redux/slices/professionalSlice/reportMappingSlice";
import { getTemplateKeyLabel } from "../../../utils/templateKeyLabel";
import Permission from "../../../components/PermissionGuard";

const ReportMapping = () => {
	const dispatch = useDispatch();

	const {
		report,
		pagination,
		loading,
		modules,
		modulesLoading,
		moduleWiseKeys,
		moduleWiseKeysLoading,
	} = useSelector((s: any) => s.reportMapping);

	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [moduleType, setModuleType] = useState("");

	const [showModal, setShowModal] = useState(false);
	const [showFieldModal, setShowFieldModal] = useState(false);
	const [editingReport, setEditingReport] = useState<any>(null);
	const [errors, setErrors] = useState<any>({});
	const [isEditingFields, setIsEditingFields] = useState(false);

	const [reportForm, setReportForm] = useState<any>({
		templateName: "",
		moduleType: "",
		file: null,
		templateMappings: {},
		mappingFields: [],
	});

	const [fieldForm, setFieldForm] = useState<any>({
		tab: "Module",
		key: "",
		type: "dropdown",
		value: "",
		customValue: "",
	});

	const [confirmTooltip, setConfirmTooltip] = useState({
		show: false,
		x: null,
		y: null,
		templateFileId: null,
	});

	const columns = [
		{ key: "templateName", title: "Template Name" },
		{ key: "moduleType", title: "Module Type" },
		{ key: "createdOn", title: "Created On", type: "date" },
	];

	useEffect(() => {
		{/* @ts-ignore */ }
		dispatch(getAllModules() as any);
	}, [dispatch]);

	const moduleOptions =
		modules?.map((item: string) => ({
			label: item,
			value: item,
		})) || [];

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

	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(search.trim());
			setLocalOffset(0);
		}, 400);

		return () => clearTimeout(t);
	}, [search]);

	const handleRefresh = async () => {
		await fetchReportMapping();
		toast.success("Report mapping list refreshed");
	};

	const syncTemplateMappings = (fields: any[]) => {
		const mappings = fields.reduce((acc: any, item: any) => {
			const finalValue = item.type === "custom" ? item.customValue : item.value;

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

			formData.append("mappings", JSON.stringify(reportForm.templateMappings));

			if (reportForm.file instanceof File) {
				formData.append("file", reportForm.file, reportForm.file.name);
			}

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
			tab: "Module",
			key: "",
			type: "dropdown",
			value: "",
			customValue: "",
		});

		setShowFieldModal(false);
	};

	const updateMappingField = (index: number, fieldKey: string, value: any) => {
		const updatedFields = [...reportForm.mappingFields];

		updatedFields[index] = {
			...updatedFields[index],
			[fieldKey]: value,
		};

		if (fieldKey === "type") {
			updatedFields[index].value = "";
			updatedFields[index].customValue = "";
		}

		syncTemplateMappings(updatedFields);
	};

	const deleteMappingField = (index: number) => {
		const updatedFields = reportForm.mappingFields.filter(
			(_: any, i: number) => i !== index
		);

		syncTemplateMappings(updatedFields);
	};

	const handleDeleteConfirm = async () => {
		try {
			// @ts-ignore
			await dispatch(deleteReportMapping(confirmTooltip.templateFileId) as any)
				.unwrap();

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

	const getModuleShortLabel = (moduleTypeValue: string) => {
		if (!moduleTypeValue) return "Module";

		const words = String(moduleTypeValue)
			.replace(/([A-Z])/g, " $1")
			.trim()
			.split(/\s+/);

		if (words.length === 1) {
			return words[0].toUpperCase();
		}

		return words.map((word) => word.charAt(0).toUpperCase()).join("");
	};

	const dynamicModuleTabLabel = getModuleShortLabel(reportForm.moduleType);

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
		<div className="w-full bg-card border border-border text-card-foreground rounded-md shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}
			<div
				id="unit-header"
				className="flex flex-wrap items-center gap-2 mb-3"
			>
				<div id="unit-summary" className="flex items-start gap-3">
					<Badge
						{...{
							count: pagination.totalDocs ?? 0,
							text: "Total Reports:",
							varient: "primary",
						}}
					/>
				</div>

				<div className="ml-auto flex flex-wrap items-center gap-2">
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

					<SearchInput {...{ search, setSearch }} />

					<DataREfreshButton {...{ callBackFn: handleRefresh }} />

					<Permission
						module="bookez"
						permissionKey="reportMappingMaster"
						action="create"
					>
						{/* @ts-ignore */}
						<DataCreateButton
							{...{
								callBackFn: openAddModal,
								text: "Add Report",
							}}
						/>
					</Permission>
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
						<Permission
							module="bookez"
							permissionKey="reportMappingMaster"
							action="update"
						>
							<button
								id="unit-edit-button"
								onClick={() => openEditModal(report)}
								className="p-2 rounded-md text-primary hover:bg-primary/10 hover:text-primary transition-all duration-200 cursor-pointer"
							>
								<Edit size={16} />
							</button>
						</Permission>

						<Permission
							module="bookez"
							permissionKey="reportMappingMaster"
							action="delete"
						>
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
								className="p-2 rounded-md text-danger hover:bg-danger/10 hover:text-danger transition-all duration-200 cursor-pointer"
							>
								<Trash2 size={16} />
							</button>
						</Permission>
					</div>
				)}
			/>

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

							<div>
								<label className="mb-1 block text-sm font-medium text-card-foreground">
									Attach Document<span className="text-danger">*</span>
								</label>

								<label className="flex h-9 w-full cursor-pointer items-center rounded-md border border-border bg-input px-3 text-sm text-foreground shadow-sm transition-all hover:border-primary">
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

									<span className="truncate text-muted-foreground">
										{reportForm.file?.name || "Select Word File (.doc, .docx)"}
									</span>
								</label>

								{errors.file && (
									<p className="mt-1 text-xs text-danger">
										{errors.file}
									</p>
								)}
							</div>

							<div className="flex items-end justify-end">
								<button
									type="button"
									onClick={() => {
										setFieldForm({
											tab: "Module",
											key: "",
											type: "dropdown",
											value: "",
											customValue: "",
										});

										setShowFieldModal(true);
									}}
									className="h-9 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
								>
									+ Add
								</button>
							</div>

							<div className="col-span-2 rounded-md border border-border bg-secondary p-4 text-secondary-foreground">
								<div className="mb-3 flex items-center justify-between gap-3">
									<h3 className="text-base font-semibold text-secondary-foreground">
										Added Fields ({reportForm.mappingFields.length})
									</h3>

									{reportForm.mappingFields.length > 0 && (
										<button
											type="button"
											onClick={() => setIsEditingFields((prev) => !prev)}
											className="rounded-md border border-border bg-card px-4 py-1.5 text-xs font-semibold text-card-foreground hover:bg-muted"
										>
											{isEditingFields ? "Cancel Edit" : "Edit Added Fields"}
										</button>
									)}
								</div>

								{reportForm.mappingFields.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No fields added yet.
									</p>
								) : isEditingFields ? (
									<div className="space-y-4">
										{reportForm.mappingFields.map(
											(item: any, index: number) => (
												<div
													key={index}
													className="rounded-md border border-border bg-card p-4 text-card-foreground"
												>
													<p className="mb-3 text-sm font-bold text-card-foreground">
														#{index + 1}
													</p>

													<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

														<div>
															<label className="mb-1 block text-sm font-medium text-card-foreground">
																Type
															</label>

															<div className="flex h-9 items-center gap-8 rounded-md border border-border bg-input px-3">
																<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
																	<input
																		type="radio"
																		checked={item.type === "dropdown"}
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

																<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
																	<input
																		type="radio"
																		checked={item.type === "custom"}
																		onChange={() =>
																			updateMappingField(index, "type", "custom")
																		}
																	/>
																	Custom
																</label>
															</div>
														</div>

														<div className="md:col-span-2">
															{item.type === "dropdown" ? (
																<SelectInput
																	label="Value"
																	value={item.value}
																	onChange={(e: any) =>
																		updateMappingField(
																			index,
																			"value",
																			e.target.value
																		)
																	}
																	options={[
																		{
																			label: moduleWiseKeysLoading
																				? "Loading Keys..."
																				: "Select Dropdown",
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

													<div className="mt-4 flex justify-end">
														<button
															type="button"
															onClick={() => deleteMappingField(index)}
															className="rounded-md bg-danger/10 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/20"
														>
															Delete
														</button>
													</div>
												</div>
											)
										)}
									</div>
									) : (
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
														className="rounded-md border border-border bg-card px-4 py-3 text-card-foreground"
													>
														<p className="mb-3 text-sm font-bold text-card-foreground">
															#{index + 1}
														</p>

														<div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
															<span className="font-semibold text-muted-foreground">
																Key
															</span>

															<span className="truncate font-semibold text-card-foreground">
																{item.key}
															</span>

															<span className="font-semibold text-muted-foreground">
																Type
															</span>

															<span className="font-semibold text-card-foreground">
																{item.type}
															</span>

															<span className="font-semibold text-muted-foreground">
																Value
															</span>

															<span className="truncate font-semibold text-card-foreground">
																{item.type === "custom"
																	? finalValue
																	: getTemplateKeyLabel(finalValue)}
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
							<div className="col-span-2 grid grid-cols-3 rounded-md bg-secondary p-1">
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
												? "bg-primary text-primary-foreground shadow-sm"
												: "text-muted-foreground hover:bg-muted hover:text-foreground"
												}`}
										>
											{tab.label}
										</button>
									);
								})}
							</div>

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

							<div>
								<label className="mb-1 block text-sm font-medium text-card-foreground">
									Type
								</label>

								<div className="flex h-9 items-center gap-8 rounded-md border border-border bg-input px-3">
									<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
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

									<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
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
												label: moduleWiseKeysLoading
													? "Loading Keys..."
													: "Select Dropdown",
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