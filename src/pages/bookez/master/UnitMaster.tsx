import React, { useEffect, useState } from "react";
import { RefreshCcw, Trash2, Edit, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import ConfirmTooltip from "../../../components/common/ConfirmTooltip";

import SearchInput from "../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../components/buttons";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import Badge from "../../../components/badge";
import { SelectInput, TextArea, TextInput } from "../../../components/inputs";
import Modal from "../../../components/modal";
import { createUnit, deleteUnit, getAllUnitMasterSchema, getAllUnits, updateUnit } from "../../../redux/slices/professionalSlice/unitMasterSlice";

const UnitMaster = () => {
	const dispatch = useDispatch();

	const {
		units,
		pagination,
		loading,
		createLoading,
		updateLoading,
		deleteLoading,
		unitMasterSchemaFields = [],
		schemaLoading,
	} = useSelector((s) => s.unitMaster);

	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	const [refreshing, setRefreshing] = useState(false);
	const [showModal, setShowModal] = useState(false);

	const [editingUnit, setEditingUnit] = useState(null);

	const [errors, setErrors] = useState({});
	console.log("units:", unitMasterSchemaFields);



	useEffect(() => {
		dispatch(
			getAllUnitMasterSchema({
				offset: 0,
				limit: 50,
			}) as any
		);
	}, [dispatch]);

	const [confirmTooltip, setConfirmTooltip] = useState({
		show: false,
		x: null,
		y: null,
		unitId: null,
	});

	const [form, setForm] = useState<any>({});

	const buildEmptyForm = (fields: any[] = []) => {
		return fields.reduce((acc: any, field: any) => {
			acc[field.key] = "";
			return acc;
		}, {});
	};

	useEffect(() => {
		if (unitMasterSchemaFields.length > 0) {
			setForm((prev: any) => ({
				...buildEmptyForm(unitMasterSchemaFields),
				...prev,
			}));
		}
	}, [unitMasterSchemaFields]);

	const validateForm = () => {
		const e: any = {};

		unitMasterSchemaFields.forEach((field: any) => {
			const value = form?.[field.key];

			if (field.isRequired && String(value || "").trim() === "") {
				e[field.key] = `${field.label} required`;
			}


			if (
				field.type === "number" &&
				value !== "" &&
				value !== null &&
				Number(value) < 0
			) {
				e[field.key] = `${field.label} cannot be negative`;
			}
		});

		setErrors(e);
		return Object.keys(e).length === 0;
	};

	const getTextValue = (value: any) => {
		if (!value) return "";

		if (typeof value === "string" || typeof value === "number") {
			return String(value);
		}

		if (typeof value === "object") {
			return (
				value.en ||
				value.name ||
				value.label ||
				value.unitName ||
				value.code ||
				Object.values(value).find((v) => typeof v === "string") ||
				""
			);
		}

		return "";
	};


	const getFieldOptions = (field: any) => {
		if (field.ref === "unitMeasurement") {
			return (
				units?.map((item: any) => {
					const value = item?.[field.valueField] || item?.unitCode || item?.code || "";
					const label = item?.[field.labelField] || item?.unitName || item?.name || value;

					return {
						value,
						label: getTextValue(label),
					};
				}) || []
			);
		}

		if (field.key === "productType") {
			return (field.options || []).map((opt: any) => {
				const label = typeof opt === "object" ? opt.label || opt.name || opt.value : opt;

				return {
					value: label,
					label,
				};
			});
		}

		return (field.options || []).map((opt: any) => {
			if (typeof opt === "object") {
				return {
					value: opt.value || opt.code || opt.name || "",
					label: opt.label || opt.name || opt.value || "",
				};
			}

			return {
				value: opt,
				label: opt,
			};
		});
	};

	const renderSchemaField = (field: any) => {
		const value = form?.[field.key] ?? "";

		const commonProps = {
			label: field.label,
			mandatory: field.isRequired,
			value,
			placeholder: `Enter ${field.label}`,
			error: errors?.[field.key],
		};

		if (field.type === "select") {
			const options = getFieldOptions(field);

			return (
				<SelectInput
					key={field.key}
					label={field.label}
					mandatory={field.isRequired}
					value={value}
					placeholder={`Select ${field.label}`}
					error={errors?.[field.key]}
					onChange={(e: any) => {
						const selectedValue = e?.target?.value ?? "";

						setForm((prev: any) => ({
							...prev,
							[field.key]: selectedValue,
						}));

						setErrors((prev: any) => ({
							...prev,
							[field.key]: "",
						}));
					}}
					options={[
						{ value: "", label: `Select ${field.label}` },
						...options,
					]}
				/>
			);
		}

		if (field.type === "number") {
			return (
				<TextInput
					key={field.key}
					{...commonProps}
					type="number"
					onChange={(e: any) => {
						setForm((prev: any) => ({
							...prev,
							[field.key]: e.target.value,
						}));

						setErrors((prev: any) => ({
							...prev,
							[field.key]: "",
						}));
					}}
				/>
			);
		}



		return (
			<TextInput
				key={field.key}
				{...commonProps}
				type="text"
				onChange={(e: any) => {
					setForm((prev: any) => ({
						...prev,
						[field.key]: e.target.value,
					}));

					setErrors((prev: any) => ({
						...prev,
						[field.key]: "",
					}));
				}}
			/>
		);
	};



	const columns = [
		{ key: 'unitId', title: 'Unit ID', },
		{ key: 'unitCode', title: 'Unit Code', },
		{ key: 'unitName', title: 'Name', },
		{ key: 'unitStatus', title: 'Status', },

	];
	/* ============================================
		  FETCH UNITS
	============================================= */
	const fetchUnits = () => {
		dispatch(
			getAllUnits({
				offset: localOffset,
				limit: localLimit,
				search: debouncedSearch,
			})
		);
	};

	useEffect(() => {
		fetchUnits();
	}, [localOffset, localLimit, debouncedSearch]);

	/* ============================================
		  DEBOUNCE SEARCH
	============================================= */
	useEffect(() => {
		const t = setTimeout(() => {
			setDebouncedSearch(search.trim());
			setLocalOffset(0);
		}, 400);
		return () => clearTimeout(t);
	}, [search]);

	/* ============================================
		  REFRESH
	============================================= */
	const handleRefresh = async () => {
		setRefreshing(true);
		await fetchUnits();
		toast.success("Unit list refreshed");
		setRefreshing(false);
	};

	/* ============================================
		  OPEN ADD MODAL
	============================================= */
	const openAddModal = () => {
		setEditingUnit(null);
		setErrors({});
		setForm(buildEmptyForm(unitMasterSchemaFields));
		setShowModal(true);
	};
	/* ============================================
		  OPEN EDIT MODAL
	============================================= */
	const openEditModal = (p: any) => {
		setEditingUnit(p);
		setErrors({});

		const nextForm = buildEmptyForm(unitMasterSchemaFields);

		unitMasterSchemaFields.forEach((field: any) => {
			const key = field.key;



			if (key === "unit") {
				if (typeof p?.unit === "object") {
					nextForm.unit =
						p.unit?.unitCode ||
						p.unit?.code ||
						p.unit?.value ||
						"";
				} else {
					nextForm.unit = p?.unit || "";
				}

				return;
			}

			nextForm[key] = p?.[key] ?? "";
		});

		setForm(nextForm);
		setShowModal(true);
	};
	/* ============================================
		  SAVE / UPDATE PRODUCT
	============================================= */
	const handleSubmit = async () => {
		if (!validateForm()) return;

		const payload: any = { ...form };

		unitMasterSchemaFields.forEach((field: any) => {
			if (field.type === "number" && payload[field.key] !== "") {
				payload[field.key] = Number(payload[field.key]);
			}
		});

		try {
			if (editingUnit) {
				const updatePayload: any = {};

				unitMasterSchemaFields.forEach((field: any) => {
					const key = field.key;

					const oldValue =
						key === "unit"
							? normalizeUnit(editingUnit?.[key] || "")
							: editingUnit?.[key];

					if (form[key] !== oldValue) {
						updatePayload[key] = payload[key];
					}
				});

				await dispatch(
					updateUnit({
						unitId: editingUnit.unitId,
						data: updatePayload,
					}) as any
				).unwrap();

				toast.success("Unit updated successfully");
			} else {
				await dispatch(createUnit(payload) as any).unwrap();
				toast.success("Unit created");
			}

			setShowModal(false);
			fetchUnits();
		} catch (err: any) {
			toast.error(err.message || "Operation failed");
		}
	};

	/* ============================================
		  DELETE UNIT
	============================================= */
	const handleDeleteConfirm = async () => {
		try {
			await dispatch(deleteUnit(confirmTooltip.unitId)).unwrap();
			toast.success("Unit deleted");
			fetchUnits();
		} finally {
			setConfirmTooltip({
				show: false,
				x: null,
				y: null,
				unitId: null,
			});
		}
	};

	/* ============================================
		  PAGINATION
	============================================= */
	const startIndex = pagination.totalDocs > 0 ? pagination.offset + 1 : 0;
	const endIndex = pagination.totalDocs > 0 ? pagination.offset + units.length : 0;

	return (
		<div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}
			<div id="unit-header" className="flex items-center mb-3">

				<div id="unit-summary" className="flex items-start gap-3">
					<Badge {...{ count: pagination.totalDocs ?? 0, text: "Total Units:", varient: "primary" }} />
				</div>

				<div className="ml-auto flex items-center gap-2">
					<SearchInput {...{ search, setSearch }} />
					<DataREfreshButton {...{ callBackFn: handleRefresh }} />
					<DataCreateButton {...{ callBackFn: openAddModal, text: "Add Unit" }} />
				</div>
			</div>

			{/* ================= TABLE ================= */}


			<DataTable
				columns={columns}
				data={units}
				loading={loading}
				emptyMessage="No units found"
				actions={(unit) => (
					<div className="flex items-center gap-2">

						<button
							id="unit-edit-button"
							onClick={() => openEditModal(unit)}
							className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer">
							<Edit size={16} />
						</button>


						<button
							id="unit-delete-button"
							onClick={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								let x = rect.left - 150;
								if (x < 10) x = 10;
								const y = rect.top + window.scrollY - 5;
								setConfirmTooltip({ show: true, x, y, unitId: acc.accountCode, });
							}}
							className="p-2 rounded-lg text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 cursor-pointer"
						>
							<Trash2 size={16} />
						</button>
					</div>
				)}
			/>

			{/* ================= PAGINATION ================= */}

			{pagination.totalDocs > 0 && <Pagination  {...{
				localLimit, selectCb: (e) => {
					setLocalLimit(Number(e.target.value));
					setLocalOffset(0);
				},
				preDisabled: !pagination.hasPrevPage,
				nextDisabled: !pagination.hasNextPage,
				setLocalOffset, pagination
			}} />}

			{/* ================= DELETE TOOLTIP ================= */}
			{
				confirmTooltip.show && (
					<ConfirmTooltip
						x={confirmTooltip.x}
						y={confirmTooltip.y}
						message="Are you sure you want to delete this product?"
						confirmText="Delete"
						cancelText="Cancel"
						onConfirm={handleDeleteConfirm}
						onCancel={() =>
							setConfirmTooltip({
								show: false,
								x: null,
								y: null,
								unitId: null,
							})
						}
					/>
				)
			}

			{/* ================= MODAL ================= */}

			<Modal
				{...{
					show: showModal,
					setShow: setShowModal,
					handleSubmit,
					state: editingUnit,
					title: "Unit",
					body: (
						<>
							{schemaLoading ? (
								<div className="py-6 text-sm text-gray-500">
									Loading product fields...
								</div>
							) : (
								unitMasterSchemaFields.map((field: any) =>
									renderSchemaField(field)
								)
							)}
						</>
					),
				}}
			/>





		</div >
	);
};

export default UnitMaster;
