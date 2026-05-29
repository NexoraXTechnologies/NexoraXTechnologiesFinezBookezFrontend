import React, { useEffect, useState } from "react";
import { RefreshCcw, Trash2, Edit, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import ConfirmTooltip from "../../../components/common/ConfirmTooltip";

import {
	getAllProducts,
	createProduct,
	updateProduct,
	deleteProduct,
	getAllProductMasterSchema
} from "../../../redux/slices/professionalSlice/productMasterSlice";
import ReadMoreText from "../../../components/common/ReadMoreText";
import SearchInput from "../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../components/buttons";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import Badge from "../../../components/badge";
import { SelectInput, TextArea, TextInput } from "../../../components/inputs";
import Modal from "../../../components/modal";

const ProductMaster = () => {
	const dispatch = useDispatch();

	const {
		products,
		pagination,
		loading,
		createLoading,
		updateLoading,
		deleteLoading,
		productMasterSchemaFields = [],
		schemaLoading,
	} = useSelector((s) => s.productMaster);

	const [localOffset, setLocalOffset] = useState(0);
	const [localLimit, setLocalLimit] = useState(10);

	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	const [refreshing, setRefreshing] = useState(false);
	const [showModal, setShowModal] = useState(false);

	const [editingProduct, setEditingProduct] = useState(null);

	const [errors, setErrors] = useState({});
	console.log("products:", products);

	const { units = [] } = useSelector((s: any) => s.unitMeasurement || {});

	useEffect(() => {
		dispatch(
			getAllProductMasterSchema({
				offset: 0,
				limit: 50,
			}) as any
		);
	}, [dispatch]);

	// useEffect(() => {
	// 	dispatch(
	// 		getAllUnitMeasurements({
	// 			offset: 0,
	// 			limit: 1000,
	// 			search: "",
	// 		}) as any
	// 	);
	// }, [dispatch]);

	const [confirmTooltip, setConfirmTooltip] = useState({
		show: false,
		x: null,
		y: null,
		productCode: null,
	});

	const [form, setForm] = useState<any>({});

	const buildEmptyForm = (fields: any[] = []) => {
		return fields.reduce((acc: any, field: any) => {
			acc[field.key] = "";
			return acc;
		}, {});
	};

	useEffect(() => {
		if (productMasterSchemaFields.length > 0) {
			setForm((prev: any) => ({
				...buildEmptyForm(productMasterSchemaFields),
				...prev,
			}));
		}
	}, [productMasterSchemaFields]);

	const validateForm = () => {
		const e: any = {};

		productMasterSchemaFields.forEach((field: any) => {
			const value = form?.[field.key];

			if (field.isRequired && String(value || "").trim() === "") {
				e[field.key] = `${field.label} required`;
			}

			if (
				field.key === "productHSNCode" &&
				value &&
				!/^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/.test(String(value))
			) {
				e[field.key] =
					"Invalid HSN/SAC code. Allowed: 2, 4, 6, or 8 digit numeric code.";
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

	const normalizeProductType = (value = "") => {
		const map: any = {
			rawmaterial: "Raw Material",
			finishedgoods: "Finished Goods",
			serviceproduct: "Service Product",
			nonstockproduct: "Non Stock Product",
			nonstocks: "Non Stock Product",
			intermediaryproduct: "Intermediary Product",
		};

		const normalizedKey = String(value).toLowerCase().replace(/\s/g, "");
		return map[normalizedKey] || value;
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

		if (field.type === "textarea") {
			return (
				<TextArea
					key={field.key}
					{...commonProps}
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

		if (field.key === "productHSNCode") {
			return (
				<TextInput
					key={field.key}
					{...commonProps}
					type="text"
					onChange={(e: any) => {
						setForm((prev: any) => ({
							...prev,
							[field.key]: e.target.value.replace(/\D/g, "").slice(0, 8),
						}));

						setErrors((prev: any) => ({
							...prev,
							[field.key]: "",
						}));
					}}
				/>
			);
		}

		if (field.key === "imageUrl") {
			return (
				<TextInput
					key={field.key}
					{...commonProps}
					type="text"
					placeholder="Enter image URL"
					onChange={(e: any) => {
						setForm((prev: any) => ({
							...prev,
							[field.key]: e.target.value,
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

	const getProductTypeLabel = (value) => {
		return (
			PRODUCT_TYPE_OPTIONS.find((item) => item.value === value)?.label ||
			value ||
			"-"
		);
	};

	const columns = [
		{ key: 'productCode', title: 'Product Code', },
		{ key: 'productName', title: 'Name', },
		// { key: 'productType', title: 'Type', },
		{
			key: "productType",
			title: "Type",
			render: (row) => normalizeProductType(row.productType),
		},
		{
			key: 'productHSNCode', title: 'HSN Code',

		},
		{ key: 'productDescription', title: 'Description', },

	];
	/* ============================================
		  FETCH PRODUCTS
	============================================= */
	const fetchProducts = () => {
		dispatch(
			getAllProducts({
				offset: localOffset,
				limit: localLimit,
				search: debouncedSearch,
			})
		);
	};

	useEffect(() => {
		fetchProducts();
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
		await fetchProducts();
		toast.success("Product list refreshed");
		setRefreshing(false);
	};

	/* ============================================
		  OPEN ADD MODAL
	============================================= */
	const openAddModal = () => {
		setEditingProduct(null);
		setErrors({});
		setForm(buildEmptyForm(productMasterSchemaFields));
		setShowModal(true);
	};
	/* ============================================
		  OPEN EDIT MODAL
	============================================= */
	const openEditModal = (p: any) => {
		setEditingProduct(p);
		setErrors({});

		const nextForm = buildEmptyForm(productMasterSchemaFields);

		productMasterSchemaFields.forEach((field: any) => {
			const key = field.key;

			if (key === "productType") {
				nextForm[key] = normalizeProductType(p?.[key] || "");
				return;
			}

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
	// const handleSubmit = async () => {

	// 	const e = {};

	// 	if (!form.productName.trim()) {
	// 		e.productName = "Product name required";
	// 	}

	// 	if (!form.productHSNCode.trim()) {
	// 		e.productHSNCode = "HSN/SAC code required";
	// 	} else if (!/^(\d{2}|\d{4}|\d{6}|\d{8})$/.test(form.productHSNCode)) {
	// 		e.productHSNCode =
	// 			"Invalid HSN/SAC code. Allowed: 2, 4, 6, or 8 digit numeric code (digits only).";
	// 	}

	// 	if (!form.productType.trim()) {
	// 		e.productType = "Product type required";
	// 	}

	// 	setErrors(e);
	// 	if (Object.keys(e).length > 0) return;

	// 	// your create/update API call below


	// 	try {
	// 		if (editingProduct) {
	// 			// Only send changed fields
	// 			const updatePayload = {};

	// 			const fields = ["productName", "productDescription", "productHSNCode", "productType"];
	// 			fields.forEach((field) => {
	// 				if (form[field] !== editingProduct[field]) {
	// 					updatePayload[field] = form[field];
	// 				}
	// 			});

	// 			await dispatch(
	// 				updateProduct({
	// 					productCode: editingProduct.productCode,
	// 					data: updatePayload,
	// 				})
	// 			).unwrap();

	// 			toast.success("Product updated successfully");
	// 		} else {
	// 			await dispatch(createProduct(form)).unwrap();
	// 			toast.success("Product created");
	// 		}

	// 		setShowModal(false);
	// 		fetchProducts();
	// 	} catch (err) {
	// 		toast.error(err.message || "Operation failed");
	// 	}
	// };



	const handleSubmit = async () => {
		if (!validateForm()) return;

		const payload: any = { ...form };

		productMasterSchemaFields.forEach((field: any) => {
			if (field.type === "number" && payload[field.key] !== "") {
				payload[field.key] = Number(payload[field.key]);
			}
		});

		try {
			if (editingProduct) {
				const updatePayload: any = {};

				productMasterSchemaFields.forEach((field: any) => {
					const key = field.key;

					const oldValue =
						key === "productType"
							? normalizeProductType(editingProduct?.[key] || "")
							: editingProduct?.[key];

					if (form[key] !== oldValue) {
						updatePayload[key] = payload[key];
					}
				});

				await dispatch(
					updateProduct({
						productCode: editingProduct.productCode,
						data: updatePayload,
					}) as any
				).unwrap();

				toast.success("Product updated successfully");
			} else {
				await dispatch(createProduct(payload) as any).unwrap();
				toast.success("Product created");
			}

			setShowModal(false);
			fetchProducts();
		} catch (err: any) {
			toast.error(err.message || "Operation failed");
		}
	};
	/* ============================================
		  DELETE PRODUCT
	============================================= */
	const handleDeleteConfirm = async () => {
		try {
			await dispatch(deleteProduct(confirmTooltip.productCode)).unwrap();
			toast.success("Product deleted");
			fetchProducts();
		} finally {
			setConfirmTooltip({
				show: false,
				x: null,
				y: null,
				productCode: null,
			});
		}
	};

	/* ============================================
		  PAGINATION
	============================================= */
	const startIndex = pagination.totalDocs > 0 ? pagination.offset + 1 : 0;
	const endIndex = pagination.totalDocs > 0 ? pagination.offset + products.length : 0;

	return (
		<div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-[100%]">
			{/* ================= HEADER ================= */}
			<div id="product-header" className="flex items-center mb-3">

				<div id="product-summary" className="flex items-start gap-3">
					<Badge {...{ count: pagination.totalDocs ?? 0, text: "Total Products:", varient: "primary" }} />
				</div>

				<div className="ml-auto flex items-center gap-2">
					<SearchInput {...{ search, setSearch }} />
					<DataREfreshButton {...{ callBackFn: handleRefresh }} />
					<DataCreateButton {...{ callBackFn: openAddModal, text: "Add Product" }} />
				</div>
			</div>

			{/* ================= TABLE ================= */}


			<DataTable
				columns={columns}
				data={products}
				loading={loading}
				emptyMessage="No products found"
				actions={(prod) => (
					<div className="flex items-center gap-2">

						<button
							id="product-edit-button"
							onClick={() => openEditModal(prod)}
							className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer">
							<Edit size={16} />
						</button>


						<button
							id="product-delete-button"
							onClick={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								let x = rect.left - 150;
								if (x < 10) x = 10;
								const y = rect.top + window.scrollY - 5;
								setConfirmTooltip({ show: true, x, y, productCode: acc.accountCode, });
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
								productCode: null,
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
					state: editingProduct,
					title: "Product",
					body: (
						<>
							{schemaLoading ? (
								<div className="py-6 text-sm text-gray-500">
									Loading product fields...
								</div>
							) : (
								productMasterSchemaFields.map((field: any) =>
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

export default ProductMaster;
