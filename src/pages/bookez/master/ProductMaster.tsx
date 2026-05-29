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

	const [confirmTooltip, setConfirmTooltip] = useState({
		show: false,
		x: null,
		y: null,
		productCode: null,
	});

	const [form, setForm] = useState({
		productName: "",
		productDescription: "",
		productHSNCode: "",
		productType: "",
	});

	const PRODUCT_TYPE_OPTIONS = [
		{ value: "", label: "Select product type" },
		{ value: "Raw Material", label: "Raw Material" },
		{ value: "Finished Goods", label: "Finished Goods" },
		{ value: "Service Product", label: "Service Product" },
		{ value: "Non Stock Product", label: "Non Stock Product" },
		{ value: "Intermediary Product", label: "Intermediary Product" },
	];

	const normalizeProductType = (value = "") => {
		const map = {
			rawmaterial: "Raw Material",
			finishedgoods: "Finished Goods",
			serviceproduct: "Service Product",
			nonstocks: "Non Stock Product",
			intermediaryproduct: "Intermediary Product",
		};

		return map[value] || value;
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

		setForm({
			productName: "",
			productDescription: "",
			productHSNCode: "",
			productType: "",
		});

		setShowModal(true);
	};

	/* ============================================
		  OPEN EDIT MODAL
	============================================= */
	const openEditModal = (p) => {
		setEditingProduct(p);

		setForm({
			productName: p.productName,
			productDescription: p.productDescription,
			productHSNCode: p.productHSNCode,
			// productType: p.productType,
			productType: normalizeProductType(p.productType),
		});

		setShowModal(true);
	};

	/* ============================================
		  SAVE / UPDATE PRODUCT
	============================================= */
	const handleSubmit = async () => {

		const e = {};

		if (!form.productName.trim()) {
			e.productName = "Product name required";
		}

		if (!form.productHSNCode.trim()) {
			e.productHSNCode = "HSN/SAC code required";
		} else if (!/^(\d{2}|\d{4}|\d{6}|\d{8})$/.test(form.productHSNCode)) {
			e.productHSNCode =
				"Invalid HSN/SAC code. Allowed: 2, 4, 6, or 8 digit numeric code (digits only).";
		}

		if (!form.productType.trim()) {
			e.productType = "Product type required";
		}

		setErrors(e);
		if (Object.keys(e).length > 0) return;

		// your create/update API call below


		try {
			if (editingProduct) {
				// Only send changed fields
				const updatePayload = {};

				const fields = ["productName", "productDescription", "productHSNCode", "productType"];
				fields.forEach((field) => {
					if (form[field] !== editingProduct[field]) {
						updatePayload[field] = form[field];
					}
				});

				await dispatch(
					updateProduct({
						productCode: editingProduct.productCode,
						data: updatePayload,
					})
				).unwrap();

				toast.success("Product updated successfully");
			} else {
				await dispatch(createProduct(form)).unwrap();
				toast.success("Product created");
			}

			setShowModal(false);
			fetchProducts();
		} catch (err) {
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

			<Modal {...{
				show: showModal, setShow: setShowModal, handleSubmit, state: editingProduct, title: "Product",
				body: <>
					{/* Product Name */}
					<TextInput {...{ label: "Product Name", mandatory: true, value: form.productName, onChange: (e) => setForm({ ...form, productName: e.target.value }), placeholder: "Enter product name", error: errors.productName }} />
					{/* <SelectInput {...{
						label: "Product Type", mandatory: true, value: form.productType,
						onChange: (e) => setForm({ ...form, productType: e?.target?.value ?? value }), placeholder: "Select product type", error: errors.productType,
						options: [
							{ value: "", label: "Select product type" },
							{ value: "Raw Material", label: "Raw Material" },
							{ value: "Finished Goods", label: "Finished Goods" },
							{ value: "Service Product", label: "Service Product" },
							{ value: "Non Stock Product", label: "Non Stock Product" },
							{ value: "Intermediary Product", label: "Intermediary Product" },
						]
					}} /> */}

					<SelectInput
						label="Product Type"
						mandatory={true}
						value={form.productType}
						onChange={(e) =>
							setForm({
								...form,
								productType: e?.target?.value || "",
							})
						}
						placeholder="Select product type"
						error={errors.productType}
						options={PRODUCT_TYPE_OPTIONS}
					/>

					<TextInput
						label="HSN Code"
						mandatory={true}
						value={form.productHSNCode}
						onChange={(e) =>
							setForm({
								...form,
								productHSNCode: e.target.value.replace(/\D/g, "").slice(0, 8),
							})
						}
						placeholder="Enter HSN code"
						error={errors.productHSNCode}
						type="text"
					/>
					<TextArea {...{ label: "Description", mandatory: true, value: form.productDescription, onChange: (e) => setForm({ ...form, productDescription: e.target.value }), placeholder: "Enter product description", error: errors.productDescription }} />
				</>
			}} />






		</div >
	);
};

export default ProductMaster;
